import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { Registration, RegistrationStatus } from '../models/Registration';
import { Event, EventStatus } from '../models/Event';
import { Ticket } from '../models/Ticket';
import { Payment, PaymentStatus } from '../models/Payment';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateQRData, generateBarcode } from '../utils/helpers';
import { sendNotification } from '../socket';

const router = Router();

// Get user's registrations
router.get('/my', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const registrations = await Registration.find({ user: req.userId })
      .populate('event', 'title banner startDate endDate location capacity')
      .populate('ticket', 'name type price')
      .sort('-createdAt');
    res.json({ success: true, data: registrations });
  } catch (error) {
    next(error);
  }
});

// Get registrations by event
router.get('/event/:eventId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const query: any = { event: req.params.eventId };
    if (status) query.status = status;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [registrations, total] = await Promise.all([
      Registration.find(query)
        .populate('user', 'name email avatar phone')
        .populate('ticket', 'name type price')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Registration.countDocuments(query),
    ]);

    const checkedIn = await Registration.countDocuments({ event: req.params.eventId, status: RegistrationStatus.CHECKED_IN });

    res.json({
      success: true,
      data: registrations,
      checkedIn,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create registration
router.post(
  '/',
  authenticate,
  validate([
    body('event').isMongoId().withMessage('Valid event ID is required'),
    body('ticket').isMongoId().withMessage('Valid ticket ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { event: eventId, ticket: ticketId, quantity } = req.body;

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      if (event.status !== EventStatus.PUBLISHED && event.status !== EventStatus.ONGOING) {
        return res.status(400).json({ success: false, message: 'Event is not accepting registrations' });
      }

      if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
      }

      if (event.registeredCount + quantity > event.capacity) {
        return res.status(400).json({ success: false, message: 'Event is at full capacity' });
      }

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket type not found' });
      }

      if (ticket.soldCount + quantity > ticket.quantity) {
        return res.status(400).json({ success: false, message: 'Not enough tickets available' });
      }

      if (ticket.maxPerOrder && quantity > ticket.maxPerOrder) {
        return res.status(400).json({ success: false, message: `Maximum ${ticket.maxPerOrder} tickets per order` });
      }

      // Check for existing registration
      const existingRegistration = await Registration.findOne({
        user: req.userId,
        event: eventId,
        status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED] },
      });
      if (existingRegistration) {
        return res.status(400).json({ success: false, message: 'You already have a registration for this event' });
      }

      const totalPrice = ticket.price * quantity;
      const barcode = generateBarcode();

      const registration = await Registration.create({
        event: eventId,
        user: req.userId,
        ticket: ticketId,
        status: totalPrice > 0 ? RegistrationStatus.PENDING : RegistrationStatus.CONFIRMED,
        quantity,
        totalPrice,
        currency: ticket.currency || 'USD',
        qrCodeData: generateQRData('', eventId),
        barcode,
      });

      // Update QR code data with registration ID
      registration.qrCodeData = generateQRData(registration._id.toString(), eventId);
      await registration.save();

      // If free ticket, update counts immediately
      if (totalPrice === 0) {
        await Ticket.findByIdAndUpdate(ticketId, { $inc: { soldCount: quantity } });
        await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: quantity } });
      }

      // Send notification
      sendNotification(
        req.userId!,
        'registration',
        'Registration Successful',
        `You've registered for ${event.title}`,
        { registrationId: registration._id, eventId }
      );

      res.status(201).json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }
);

// Cancel registration
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Registration is already cancelled' });
    }

    registration.status = RegistrationStatus.CANCELLED;
    registration.cancelledAt = new Date();
    registration.cancellationReason = req.body.reason || 'User requested cancellation';
    await registration.save();

    // Update ticket sold count
    await Ticket.findByIdAndUpdate(registration.ticket, {
      $inc: { soldCount: -registration.quantity },
    });

    // Update event registered count
    await Event.findByIdAndUpdate(registration.event, {
      $inc: { registeredCount: -registration.quantity },
    });

    // Cancel payment if exists
    await Payment.findOneAndUpdate(
      { registration: registration._id, status: PaymentStatus.PENDING },
      { status: PaymentStatus.FAILED }
    );

    res.json({ success: true, message: 'Registration cancelled', data: registration });
  } catch (error) {
    next(error);
  }
});

// Check-in registration
router.patch('/:id/checkin', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Cannot check-in a cancelled registration' });
    }

    if (registration.status === RegistrationStatus.CHECKED_IN) {
      return res.status(400).json({ success: false, message: 'Already checked in' });
    }

    registration.status = RegistrationStatus.CHECKED_IN;
    registration.checkedInAt = new Date();
    await registration.save();

    res.json({ success: true, message: 'Check-in successful', data: registration });
  } catch (error) {
    next(error);
  }
});

// Approve registration (for organizer)
router.patch('/:id/approve', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const event = await Event.findById(registration.event);
    if (!event || (event.organizer.toString() !== req.userId && req.userRole !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    registration.status = RegistrationStatus.CONFIRMED;
    await registration.save();

    await Ticket.findByIdAndUpdate(registration.ticket, { $inc: { soldCount: registration.quantity } });
    await Event.findByIdAndUpdate(registration.event, { $inc: { registeredCount: registration.quantity } });

    sendNotification(
      registration.user.toString(),
      'registration',
      'Registration Approved',
      `Your registration for ${event.title} has been approved.`,
      { registrationId: registration._id }
    );

    res.json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
});

// Reject registration
router.patch('/:id/reject', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const event = await Event.findById(registration.event);
    if (!event || (event.organizer.toString() !== req.userId && req.userRole !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    registration.status = RegistrationStatus.REJECTED;
    registration.cancellationReason = req.body.reason || 'Registration rejected';
    await registration.save();

    sendNotification(
      registration.user.toString(),
      'registration',
      'Registration Rejected',
      `Your registration for ${event.title} has been rejected. ${req.body.reason ? 'Reason: ' + req.body.reason : ''}`,
      { registrationId: registration._id }
    );

    res.json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
});

export default router;
