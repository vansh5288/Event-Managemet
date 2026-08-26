import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { recommendEvents, recommendSpeakers, findSimilarUsers } from '../ai/recommendation';
import { analyzeSentiment, generateEventSummary } from '../ai/sentiment';
import { getChatbotResponse, generateEventEmail, detectSpam } from '../ai/chatbot';
import { Event } from '../models/Event';
import { Review } from '../models/Review';

const router = Router();

// AI Event Recommendations
router.get('/recommendations', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const events = await recommendEvents(req.userId!, limit);
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
});

// AI Speaker Recommendations
router.get('/speakers', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = (req.query.category as string) || '';
    const speakers = await recommendSpeakers(category);
    res.json({ success: true, data: speakers });
  } catch (error) {
    next(error);
  }
});

// AI Networking Suggestions (similar users)
router.get('/networking', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 5;
    const users = await findSimilarUsers(req.userId!, limit);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// AI Chatbot
router.post('/chat', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const response = await getChatbotResponse(message, {
      userId: req.userId,
      role: req.userRole,
    });
    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// AI Email Generator
router.post('/email', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventName, emailType, audience, details } = req.body;
    if (!eventName || !emailType || !audience) {
      return res.status(400).json({ success: false, message: 'eventName, emailType, and audience are required' });
    }

    const email = await generateEventEmail(eventName, emailType, audience, details);
    res.json({ success: true, data: email });
  } catch (error) {
    next(error);
  }
});

// AI Sentiment Analysis
router.post('/sentiment', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const sentiment = await analyzeSentiment(text);
    res.json({ success: true, data: sentiment });
  } catch (error) {
    next(error);
  }
});

// AI Event Summary
router.get('/summary/:eventId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const reviews = await Review.find({ event: event._id }).select('comment rating');
    const summary = await generateEventSummary(event, reviews);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// AI Spam Detection
router.post('/spam', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const result = await detectSpam(text);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
