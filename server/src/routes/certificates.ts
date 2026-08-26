import { Router, Response, NextFunction, Request } from 'express';
import { Certificate } from '../models/Certificate';
import { Registration } from '../models/Registration';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateCertificateId } from '../utils/helpers';
import { ExportService } from '../services/export.service';

const router = Router();

router.get('/my', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const certificates = await Certificate.find({ user: req.userId })
      .populate('event', 'title startDate endDate')
      .sort('-issuedAt');
    res.json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
});

router.get('/event/:eventId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const certificates = await Certificate.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort('-issuedAt');
    res.json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
});

router.post('/generate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { registrationId } = req.body;
    const registration = await Registration.findById(registrationId).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const certificate = await Certificate.create({
      event: registration.event._id,
      user: registration.user,
      registration: registration._id,
      certificateId: generateCertificateId(),
      title: `Certificate of Attendance - ${(registration.event as any).title}`,
      issuedAt: new Date(),
    });

    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
});

router.get('/verify/:certificateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('user', 'name email')
      .populate('event', 'title startDate endDate');
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.json({ success: true, data: certificate, message: 'Certificate is valid' });
  } catch (error) {
    next(error);
  }
});

// Download certificate as PDF (rendered via export service)
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name email')
      .populate('event', 'title startDate endDate');
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    if (certificate.user._id.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const event = certificate.event as any;
    const pdf = ExportService.toPDF(
      'Certificate of Attendance',
      [
        {
          'Certificate ID': certificate.certificateId,
          'Recipient': (certificate.user as any).name,
          'Email': (certificate.user as any).email,
          'Event': event?.title || 'EventHub Event',
          'Issued': new Date(certificate.issuedAt).toISOString(),
        },
      ],
      ['Certificate ID', 'Recipient', 'Email', 'Event', 'Issued']
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

export default router;
