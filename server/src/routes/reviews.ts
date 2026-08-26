import { Router, Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Event } from '../models/Event';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get reviews for an event
router.get('/event/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'name email avatar')
      .sort('-createdAt');

    const avgRating = await Review.aggregate([
      { $match: { event: req.params.eventId } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    res.json({
      success: true,
      data: reviews,
      averageRating: avgRating[0]?.avg || 0,
    });
  } catch (error) {
    next(error);
  }
});

// Create review
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { event, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check for existing review
    const existingReview = await Review.findOne({ event, user: req.userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You already reviewed this event' });
    }

    const review = await Review.create({
      event,
      user: req.userId,
      rating,
      comment,
    });

    // Update event's rating
    const reviews = await Review.find({ event });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Event.findByIdAndUpdate(event, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// Update review
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment !== undefined ? req.body.comment : review.comment;
    await review.save();

    // Update event rating
    const reviews = await Review.find({ event: review.event });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Event.findByIdAndUpdate(review.event, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// Delete review
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Review.findByIdAndDelete(req.params.id);

    const reviews = await Review.find({ event: review.event });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await Event.findByIdAndUpdate(review.event, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
