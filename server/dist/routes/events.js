"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Event_1 = require("../models/Event");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Get all events (with filters, pagination, search)
router.get('/', async (req, res, next) => {
    try {
        const { page = '1', limit = '12', category, status, search, startDate, endDate, city, country, minPrice, maxPrice, sort = '-startDate', } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (status)
            query.status = status;
        if (city)
            query['location.city'] = city;
        if (country)
            query['location.country'] = country;
        if (startDate)
            query.startDate = { $gte: new Date(startDate) };
        if (endDate)
            query.endDate = { $lte: new Date(endDate) };
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = Number(minPrice);
            if (maxPrice)
                query.price.$lte = Number(maxPrice);
        }
        if (search) {
            query.$text = { $search: search };
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [events, total] = await Promise.all([
            Event_1.Event.find(query)
                .populate('organizer', 'name email avatar')
                .populate('venue', 'name city country')
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            Event_1.Event.countDocuments(query),
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
    }
    catch (error) {
        next(error);
    }
});
// Get single event
router.get('/:id', async (req, res, next) => {
    try {
        const event = await Event_1.Event.findById(req.params.id)
            .populate('organizer', 'name email avatar bio')
            .populate('venue')
            .populate('speakers', 'name email avatar bio')
            .populate('sponsors')
            .populate('sessions')
            .populate('ticketTypes');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        event.views += 1;
        await event.save();
        res.json({ success: true, data: event });
    }
    catch (error) {
        next(error);
    }
});
// Create event
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), (0, validate_1.validate)([
    (0, express_validator_1.body)('title').trim().notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('description').trim().notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('shortDescription').trim().notEmpty().withMessage('Short description is required'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('startDate').isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.body)('endDate').isISO8601().withMessage('Valid end date is required'),
    (0, express_validator_1.body)('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
]), async (req, res, next) => {
    try {
        const eventData = { ...req.body, organizer: req.userId };
        const event = await Event_1.Event.create(eventData);
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        next(error);
    }
});
// Update event
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const updatedEvent = await Event_1.Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, data: updatedEvent });
    }
    catch (error) {
        next(error);
    }
});
// Delete event
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await Event_1.Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Duplicate event
router.post('/:id/duplicate', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const duplicateData = event.toObject();
        delete duplicateData._id;
        delete duplicateData.__v;
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;
        duplicateData.title = `${duplicateData.title} (Copy)`;
        duplicateData.status = Event_1.EventStatus.DRAFT;
        duplicateData.registeredCount = 0;
        duplicateData.waitlistCount = 0;
        duplicateData.views = 0;
        const duplicatedEvent = await Event_1.Event.create(duplicateData);
        res.status(201).json({ success: true, data: duplicatedEvent });
    }
    catch (error) {
        next(error);
    }
});
// Get events by organizer
router.get('/organizer/:organizerId', async (req, res, next) => {
    try {
        const events = await Event_1.Event.find({ organizer: req.params.organizerId }).sort('-createdAt');
        res.json({ success: true, data: events });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map