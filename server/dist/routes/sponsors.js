"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Sponsor_1 = require("../models/Sponsor");
const Event_1 = require("../models/Event");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get sponsors by event
router.get('/event/:eventId', async (req, res, next) => {
    try {
        const sponsors = await Sponsor_1.Sponsor.find({ event: req.params.eventId, isActive: true }).sort('-amount');
        res.json({ success: true, data: sponsors });
    }
    catch (error) {
        next(error);
    }
});
// Get all sponsors
router.get('/', async (req, res, next) => {
    try {
        const sponsors = await Sponsor_1.Sponsor.find().populate('event', 'title').sort('-createdAt');
        res.json({ success: true, data: sponsors });
    }
    catch (error) {
        next(error);
    }
});
// Create sponsor
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const event = await Event_1.Event.findById(req.body.event);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const sponsor = await Sponsor_1.Sponsor.create(req.body);
        await Event_1.Event.findByIdAndUpdate(req.body.event, { $push: { sponsors: sponsor._id } });
        res.status(201).json({ success: true, data: sponsor });
    }
    catch (error) {
        next(error);
    }
});
// Update sponsor
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const sponsor = await Sponsor_1.Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!sponsor) {
            return res.status(404).json({ success: false, message: 'Sponsor not found' });
        }
        res.json({ success: true, data: sponsor });
    }
    catch (error) {
        next(error);
    }
});
// Delete sponsor
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const sponsor = await Sponsor_1.Sponsor.findByIdAndDelete(req.params.id);
        if (!sponsor) {
            return res.status(404).json({ success: false, message: 'Sponsor not found' });
        }
        await Event_1.Event.findByIdAndUpdate(sponsor.event, { $pull: { sponsors: sponsor._id } });
        res.json({ success: true, message: 'Sponsor deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=sponsors.js.map