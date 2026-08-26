"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const recommendation_1 = require("../ai/recommendation");
const sentiment_1 = require("../ai/sentiment");
const chatbot_1 = require("../ai/chatbot");
const Event_1 = require("../models/Event");
const Review_1 = require("../models/Review");
const router = (0, express_1.Router)();
// AI Event Recommendations
router.get('/recommendations', auth_1.authenticate, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 6;
        const events = await (0, recommendation_1.recommendEvents)(req.userId, limit);
        res.json({ success: true, data: events });
    }
    catch (error) {
        next(error);
    }
});
// AI Speaker Recommendations
router.get('/speakers', auth_1.authenticate, async (req, res, next) => {
    try {
        const category = req.query.category || '';
        const speakers = await (0, recommendation_1.recommendSpeakers)(category);
        res.json({ success: true, data: speakers });
    }
    catch (error) {
        next(error);
    }
});
// AI Networking Suggestions (similar users)
router.get('/networking', auth_1.authenticate, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 5;
        const users = await (0, recommendation_1.findSimilarUsers)(req.userId, limit);
        res.json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
});
// AI Chatbot
router.post('/chat', auth_1.authenticate, async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }
        const response = await (0, chatbot_1.getChatbotResponse)(message, {
            userId: req.userId,
            role: req.userRole,
        });
        res.json({ success: true, data: response });
    }
    catch (error) {
        next(error);
    }
});
// AI Email Generator
router.post('/email', auth_1.authenticate, async (req, res, next) => {
    try {
        const { eventName, emailType, audience, details } = req.body;
        if (!eventName || !emailType || !audience) {
            return res.status(400).json({ success: false, message: 'eventName, emailType, and audience are required' });
        }
        const email = await (0, chatbot_1.generateEventEmail)(eventName, emailType, audience, details);
        res.json({ success: true, data: email });
    }
    catch (error) {
        next(error);
    }
});
// AI Sentiment Analysis
router.post('/sentiment', auth_1.authenticate, async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }
        const sentiment = await (0, sentiment_1.analyzeSentiment)(text);
        res.json({ success: true, data: sentiment });
    }
    catch (error) {
        next(error);
    }
});
// AI Event Summary
router.get('/summary/:eventId', auth_1.authenticate, async (req, res, next) => {
    try {
        const event = await Event_1.Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const reviews = await Review_1.Review.find({ event: event._id }).select('comment rating');
        const summary = await (0, sentiment_1.generateEventSummary)(event, reviews);
        res.json({ success: true, data: summary });
    }
    catch (error) {
        next(error);
    }
});
// AI Spam Detection
router.post('/spam', auth_1.authenticate, async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }
        const result = await (0, chatbot_1.detectSpam)(text);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map