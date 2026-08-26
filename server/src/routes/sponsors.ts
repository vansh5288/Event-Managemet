import { Router, Request, Response, NextFunction } from 'express';
import { Sponsor } from '../models/Sponsor';
import { Event } from '../models/Event';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get sponsors by event
router.get('/event/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsors = await Sponsor.find({ event: req.params.eventId, isActive: true }).sort('-amount');
    res.json({ success: true, data: sponsors });
  } catch (error) {
    next(error);
  }
});

// Get all sponsors
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsors = await Sponsor.find().populate('event', 'title').sort('-createdAt');
    res.json({ success: true, data: sponsors });
  } catch (error) {
    next(error);
  }
});

// Create sponsor
router.post('/', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.body.event);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const sponsor = await Sponsor.create(req.body);
    await Event.findByIdAndUpdate(req.body.event, { $push: { sponsors: sponsor._id } });
    res.status(201).json({ success: true, data: sponsor });
  } catch (error) {
    next(error);
  }
});

// Update sponsor
router.put('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sponsor) {
      return res.status(404).json({ success: false, message: 'Sponsor not found' });
    }
    res.json({ success: true, data: sponsor });
  } catch (error) {
    next(error);
  }
});

// Delete sponsor
router.delete('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
    if (!sponsor) {
      return res.status(404).json({ success: false, message: 'Sponsor not found' });
    }
    await Event.findByIdAndUpdate(sponsor.event, { $pull: { sponsors: sponsor._id } });
    res.json({ success: true, message: 'Sponsor deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
