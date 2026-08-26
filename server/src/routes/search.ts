import { Router, Request, Response, NextFunction } from 'express';
import { Event, EventStatus } from '../models/Event';
import { User } from '../models/User';
import { Venue } from '../models/Venue';

const router = Router();

// Global search
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type = 'all', page = '1', limit = '10' } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchQuery = q as string;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const results: any = {};

    // Search events
    if (type === 'all' || type === 'events') {
      const eventQuery: any = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { shortDescription: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } },
          { 'location.city': { $regex: searchQuery, $options: 'i' } },
          { 'location.country': { $regex: searchQuery, $options: 'i' } },
        ],
        status: { $in: [EventStatus.PUBLISHED, EventStatus.ONGOING] },
      };

      const [events, eventsTotal] = await Promise.all([
        Event.find(eventQuery)
          .populate('organizer', 'name email avatar')
          .select('title shortDescription banner startDate location category price currency')
          .sort('-startDate')
          .skip(skip)
          .limit(limitNum),
        Event.countDocuments(eventQuery),
      ]);

      results.events = {
        data: events,
        total: eventsTotal,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(eventsTotal / limitNum),
        },
      };
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const userQuery = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { organization: { $regex: searchQuery, $options: 'i' } },
        ],
        isActive: true,
      };

      const [users, usersTotal] = await Promise.all([
        User.find(userQuery)
          .select('name email avatar role organization')
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(userQuery),
      ]);

      results.users = {
        data: users,
        total: usersTotal,
      };
    }

    // Search venues
    if (type === 'all' || type === 'venues') {
      const venueQuery = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { city: { $regex: searchQuery, $options: 'i' } },
          { country: { $regex: searchQuery, $options: 'i' } },
          { address: { $regex: searchQuery, $options: 'i' } },
        ],
        isActive: true,
      };

      const [venues, venuesTotal] = await Promise.all([
        Venue.find(venueQuery)
          .select('name city country capacity amenities')
          .skip(skip)
          .limit(limitNum),
        Venue.countDocuments(venueQuery),
      ]);

      results.venues = {
        data: venues,
        total: venuesTotal,
      };
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

export default router;
