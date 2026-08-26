"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Ticket_1 = require("../models/Ticket");
const Event_1 = require("../models/Event");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get tickets for an event
router.get('/event/:eventId', async (req, res, next) => {
    try {
        const tickets = await Ticket_1.Ticket.find({ event: req.params.eventId, status: 'available' });
        res.json({ success: true, data: tickets });
    }
    catch (error) {
        next(error);
    }
});
// Create ticket type
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const event = await Event_1.Event.findById(req.body.event);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.organizer.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const ticket = await Ticket_1.Ticket.create(req.body);
        await Event_1.Event.findByIdAndUpdate(req.body.event, { $push: { ticketTypes: ticket._id } });
        res.status(201).json({ success: true, data: ticket });
    }
    catch (error) {
        next(error);
    }
});
// Update ticket
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const ticket = await Ticket_1.Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        res.json({ success: true, data: ticket });
    }
    catch (error) {
        next(error);
    }
});
// Delete ticket
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const ticket = await Ticket_1.Ticket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        await Event_1.Event.findByIdAndUpdate(ticket.event, { $pull: { ticketTypes: ticket._id } });
        res.json({ success: true, message: 'Ticket deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=tickets.js.map