import { Router, Request, Response, NextFunction } from 'express';
import { Ticket } from '../models/Ticket';
import { Event } from '../models/Event';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get tickets for an event
router.get('/event/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
const tickets = await Ticket.find({ event: req.params.eventId, status: 'available' } as any);
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Create ticket type
router.post('/', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.body.event);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const ticket = await Ticket.create(req.body);
    await Event.findByIdAndUpdate(req.body.event, { $push: { ticketTypes: ticket._id } });
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Update ticket
router.put('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Delete ticket
router.delete('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    await Event.findByIdAndUpdate(ticket.event, { $pull: { ticketTypes: ticket._id } });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
