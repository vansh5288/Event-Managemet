import { Router, Request, Response, NextFunction } from 'express';
import { Venue } from '../models/Venue';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all venues
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', city, country, isActive } = req.query;
    const query: any = {};
    if (city) query.city = city;
    if (country) query.country = country;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [venues, total] = await Promise.all([
      Venue.find(query).sort('-createdAt').skip(skip).limit(limitNum),
      Venue.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: venues,
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

// Get single venue
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }
    res.json({ success: true, data: venue });
  } catch (error) {
    next(error);
  }
});

// Create venue
router.post('/', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json({ success: true, data: venue });
  } catch (error) {
    next(error);
  }
});

// Update venue
router.put('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }
    res.json({ success: true, data: venue });
  } catch (error) {
    next(error);
  }
});

// Delete venue
router.delete('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }
    res.json({ success: true, message: 'Venue deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
