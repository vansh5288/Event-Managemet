import { Router, Request, Response, NextFunction } from 'express';
import { Waitlist, WaitlistStatus } from '../models/Waitlist';
import { Event } from '../models/Event';
import { Registration, RegistrationStatus } from '../models/Registration';
import { Ticket } from '../models/Ticket';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../socket';

const router = Router();

// Join waitlist for an event
router.post('/join', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { event: eventId, ticketType } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if already on waitlist
    const existing = await Waitlist.findOne({ event: eventId, user: req.userId });
    if (existing && existing.status === WaitlistStatus.WAITING) {
      return res.status(400).json({ success: false, message: 'You are already on the waitlist' });
    }

    if (existing) {
      existing.status = WaitlistStatus.WAITING;
      existing.position = await Waitlist.countDocuments({ event: eventId, status: WaitlistStatus.WAITING }) + 1;
      await existing.save();
      return res.json({ success: true, message: 'Re-joined waitlist', data: existing });
    }

    const position = await Waitlist.countDocuments({ event: eventId, status: WaitlistStatus.WAITING }) + 1;

    const waitlistEntry = await Waitlist.create({
      event: eventId,
      user: req.userId,
      ticketType: ticketType || undefined,
      status: WaitlistStatus.WAITING,
      position,
    });

    sendNotification(
      req.userId!,
      'registration',
      'Added to Waitlist',
      `You've been added to the waitlist for ${event.title}. Position: #${position}`,
      { waitlistId: waitlistEntry._id, eventId }
    );

    res.status(201).json({ success: true, data: waitlistEntry });
  } catch (error) {
    next(error);
  }
});

// Get user's waitlist entries
router.get('/my', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const waitlist = await Waitlist.find({ user: req.userId })
      .populate('event', 'title startDate banner capacity')
      .populate('ticketType', 'name type price')
      .sort('position');
    res.json({ success: true, data: waitlist });
  } catch (error) {
    next(error);
  }
});

// Get waitlist for an event (organizer)
router.get('/event/:eventId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const waitlist = await Waitlist.find({ event: req.params.eventId, status: WaitlistStatus.WAITING })
      .populate('user', 'name email avatar')
      .populate('ticketType', 'name type price')
      .sort('position');
    res.json({ success: true, data: waitlist });
  } catch (error) {
    next(error);
  }
});

// Promote waitlist entry to registration (organizer)
router.post('/:id/promote', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await Waitlist.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
    }

    const event = await Event.findById(entry.event);
    if (!event || (event.organizer.toString() !== req.userId && req.userRole !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (entry.status !== WaitlistStatus.WAITING) {
      return res.status(400).json({ success: false, message: 'Entry is not waiting' });
    }

    // Create a registration for the user if there's capacity
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity' });
    }

    let ticket = null;
    if (entry.ticketType) {
      ticket = await Ticket.findById(entry.ticketType);
    }
    if (!ticket) {
      ticket = await Ticket.findOne({ event: entry.event, type: 'free' });
    }
    if (!ticket) {
      return res.status(400).json({ success: false, message: 'No available ticket type for promotion' });
    }

    const registration = await Registration.create({
      event: entry.event,
      user: entry.user,
      ticket: ticket._id,
      status: RegistrationStatus.CONFIRMED,
      quantity: 1,
      totalPrice: ticket.price,
      currency: ticket.currency || event.currency || 'USD',
    });

    await Event.findByIdAndUpdate(entry.event, { $inc: { registeredCount: 1 } });
    await Ticket.findByIdAndUpdate(ticket._id, { $inc: { soldCount: 1 } });

    entry.status = WaitlistStatus.REGISTERED;
    await entry.save();

    sendNotification(
      entry.user.toString(),
      'registration',
      'Waitlist Promoted!',
      `Great news! A spot opened up for ${event.title} and you've been registered.`,
      { registrationId: registration._id, eventId: entry.event }
    );

    res.json({ success: true, message: 'Waitlist entry promoted to registration', data: registration });
  } catch (error) {
    next(error);
  }
});

// Cancel waitlist entry
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await Waitlist.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
    }
    if (entry.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    entry.status = WaitlistStatus.CANCELLED;
    await entry.save();
    res.json({ success: true, message: 'Left waitlist' });
  } catch (error) {
    next(error);
  }
});

export default router;

