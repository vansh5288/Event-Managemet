import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { Event, EventStatus } from '../models/Event';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Get all events (with filters, pagination, search)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      status,
      search,
      startDate,
      endDate,
      city,
      country,
      minPrice,
      maxPrice,
      sort = '-startDate',
    } = req.query;

    const query: any = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (city) query['location.city'] = city;
    if (country) query['location.country'] = country;
    if (startDate) query.startDate = { $gte: new Date(startDate as string) };
    if (endDate) query.endDate = { $lte: new Date(endDate as string) };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search as string };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'name email avatar')
        .populate('venue', 'name city country')
        .sort(sort as string)
        .skip(skip)
        .limit(limitNum),
      Event.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: events,
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

// Get events by organizer (must be declared before '/:id' route)
router.get('/organizer/:organizerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await Event.find({ organizer: req.params.organizerId }).sort('-createdAt');
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
});

// Get single event
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email avatar bio')
      .populate('venue')
      .populate('speakers', 'name email avatar bio')
      .populate('sponsors')
      .populate('sessions')
      .populate('ticketTypes');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only increment view count for published/ongoing events and not on every fetch
    if (event.status !== EventStatus.DRAFT) {
      event.views += 1;
      await event.save();
    }

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// Create event
router.post(
  '/',
  authenticate,
  authorize('admin', 'organizer'),
  validate([
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('shortDescription').trim().notEmpty().withMessage('Short description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const eventData = { ...req.body, organizer: req.userId };
      const event = await Event.create(eventData);
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }
);

// Update event
router.put('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    next(error);
  }
});

// Delete event
router.delete('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Duplicate event
router.post('/:id/duplicate', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Ownership check
    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to duplicate this event' });
    }

    const duplicateData = event.toObject();
    delete (duplicateData as any)._id;
    delete (duplicateData as any).__v;
    delete (duplicateData as any).createdAt;
    delete (duplicateData as any).updatedAt;
    duplicateData.title = `${duplicateData.title} (Copy)`;
    duplicateData.status = EventStatus.DRAFT;
    duplicateData.registeredCount = 0;
    duplicateData.waitlistCount = 0;
    duplicateData.views = 0;

    const duplicatedEvent = await Event.create(duplicateData);
    res.status(201).json({ success: true, data: duplicatedEvent });
  } catch (error) {
    next(error);
  }
});

// Publish event
router.patch('/:id/publish', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    event.status = EventStatus.PUBLISHED;
    if (!event.registrationDeadline) {
      event.registrationDeadline = event.startDate;
    }
    await event.save();

    res.json({ success: true, message: 'Event published successfully', data: event });
  } catch (error) {
    next(error);
  }
});

// Cancel event
router.patch('/:id/cancel', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    event.status = EventStatus.CANCELLED;
    await event.save();

    res.json({ success: true, message: 'Event cancelled successfully', data: event });
  } catch (error) {
    next(error);
  }
});

// Toggle featured
router.patch('/:id/feature', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    event.featured = !event.featured;
    await event.save();
    res.json({ success: true, message: 'Event feature toggled', data: event });
  } catch (error) {
    next(error);
  }
});

export default router;
