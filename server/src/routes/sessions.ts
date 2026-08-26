import { Router, Request, Response, NextFunction } from 'express';
import { Session } from '../models/Session';
import { Event } from '../models/Event';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// Get sessions for an event
router.get('/event/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await Session.find({ event: req.params.eventId, isActive: true })
      .populate('speaker', 'name email avatar bio organization')
      .sort('startTime');
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

// Get session by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await Session.findById(req.params.id).populate('speaker', 'name email avatar bio');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// Create session
router.post(
  '/',
  authenticate,
  authorize('admin', 'organizer'),
  validate([
    body('event').isMongoId().withMessage('Valid event ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const event = await Event.findById(req.body.event);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const session = await Session.create(req.body);
      await Event.findByIdAndUpdate(req.body.event, { $push: { sessions: session._id } });
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
);

// Update session
router.put('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const event = await Event.findById(session.event);
    if (!event || (event.organizer.toString() !== req.userId && req.userRole !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete session
router.delete('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const event = await Event.findById(session.event);
    if (!event || (event.organizer.toString() !== req.userId && req.userRole !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Session.findByIdAndDelete(req.params.id);
    await Event.findByIdAndUpdate(session.event, { $pull: { sessions: session._id } });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

