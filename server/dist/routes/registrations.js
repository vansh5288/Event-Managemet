"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Registration_1 = require("../models/Registration");
const Event_1 = require("../models/Event");
const Ticket_1 = require("../models/Ticket");
const Payment_1 = require("../models/Payment");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const helpers_1 = require("../utils/helpers");
const socket_1 = require("../socket");
const router = (0, express_1.Router)();
// Get user's registrations
router.get('/my', auth_1.authenticate, async (req, res, next) => {
    try {
        const registrations = await Registration_1.Registration.find({ user: req.userId })
            .populate('event', 'title banner startDate endDate location capacity')
            .populate('ticket', 'name type price')
            .sort('-createdAt');
        res.json({ success: true, data: registrations });
    }
    catch (error) {
        next(error);
    }
});
// Get registrations by event
router.get('/event/:eventId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { page = '1', limit = '20', status } = req.query;
        const query = { event: req.params.eventId };
        if (status)
            query.status = status;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [registrations, total] = await Promise.all([
            Registration_1.Registration.find(query)
                .populate('user', 'name email avatar phone')
                .populate('ticket', 'name type price')
                .sort('-createdAt')
                .skip(skip)
                .limit(limitNum),
            Registration_1.Registration.countDocuments(query),
        ]);
        const checkedIn = await Registration_1.Registration.countDocuments({ event: req.params.eventId, status: Registration_1.RegistrationStatus.CHECKED_IN });
        res.json({
            success: true,
            data: registrations,
            checkedIn,
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
// Create registration
router.post('/', auth_1.authenticate, (0, validate_1.validate)([
    (0, express_validator_1.body)('event').isMongoId().withMessage('Valid event ID is required'),
    (0, express_validator_1.body)('ticket').isMongoId().withMessage('Valid ticket ID is required'),
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
]), async (req, res, next) => {
    try {
        const { event: eventId, ticket: ticketId, quantity } = req.body;
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.status !== Event_1.EventStatus.PUBLISHED && event.status !== Event_1.EventStatus.ONGOING) {
            return res.status(400).json({ success: false, message: 'Event is not accepting registrations' });
        }
        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
        }
        if (event.registeredCount + quantity > event.capacity) {
            return res.status(400).json({ success: false, message: 'Event is at full capacity' });
        }
        const ticket = await Ticket_1.Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket type not found' });
        }
        if (ticket.soldCount + quantity > ticket.quantity) {
            return res.status(400).json({ success: false, message: 'Not enough tickets available' });
        }
        if (ticket.maxPerOrder && quantity > ticket.maxPerOrder) {
            return res.status(400).json({ success: false, message: `Maximum ${ticket.maxPerOrder} tickets per order` });
        }
        // Check for existing registration
        const existingRegistration = await Registration_1.Registration.findOne({
            user: req.userId,
            event: eventId,
            status: { $in: [Registration_1.RegistrationStatus.PENDING, Registration_1.RegistrationStatus.CONFIRMED] },
        });
        if (existingRegistration) {
            return res.status(400).json({ success: false, message: 'You already have a registration for this event' });
        }
        const totalPrice = ticket.price * quantity;
        const barcode = (0, helpers_1.generateBarcode)();
        const registration = await Registration_1.Registration.create({
            event: eventId,
            user: req.userId,
            ticket: ticketId,
            status: totalPrice > 0 ? Registration_1.RegistrationStatus.PENDING : Registration_1.RegistrationStatus.CONFIRMED,
            quantity,
            totalPrice,
            currency: ticket.currency || 'USD',
            qrCodeData: (0, helpers_1.generateQRData)('', eventId),
            barcode,
        });
        // Update QR code data with registration ID
        registration.qrCodeData = (0, helpers_1.generateQRData)(registration._id.toString(), eventId);
        await registration.save();
        // If free ticket, update counts immediately
        if (totalPrice === 0) {
            await Ticket_1.Ticket.findByIdAndUpdate(ticketId, { $inc: { soldCount: quantity } });
            await Event_1.Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: quantity } });
        }
        // Send notification
        (0, socket_1.sendNotification)(req.userId, 'registration', 'Registration Successful', `You've registered for ${event.title}`, { registrationId: registration._id, eventId });
        res.status(201).json({ success: true, data: registration });
    }
    catch (error) {
        next(error);
    }
});
// Cancel registration
router.patch('/:id/cancel', auth_1.authenticate, async (req, res, next) => {
    try {
        const registration = await Registration_1.Registration.findById(req.params.id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        if (registration.user.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (registration.status === Registration_1.RegistrationStatus.CANCELLED) {
            return res.status(400).json({ success: false, message: 'Registration is already cancelled' });
        }
        registration.status = Registration_1.RegistrationStatus.CANCELLED;
        registration.cancelledAt = new Date();
        registration.cancellationReason = req.body.reason || 'User requested cancellation';
        await registration.save();
        // Update ticket sold count
        await Ticket_1.Ticket.findByIdAndUpdate(registration.ticket, {
            $inc: { soldCount: -registration.quantity },
        });
        // Update event registered count
        await Event_1.Event.findByIdAndUpdate(registration.event, {
            $inc: { registeredCount: -registration.quantity },
        });
        // Cancel payment if exists
        await Payment_1.Payment.findOneAndUpdate({ registration: registration._id, status: Payment_1.PaymentStatus.PENDING }, { status: Payment_1.PaymentStatus.FAILED });
        res.json({ success: true, message: 'Registration cancelled', data: registration });
    }
    catch (error) {
        next(error);
    }
});
// Check-in registration
router.patch('/:id/checkin', auth_1.authenticate, async (req, res, next) => {
    try {
        const registration = await Registration_1.Registration.findById(req.params.id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        if (registration.status === Registration_1.RegistrationStatus.CANCELLED) {
            return res.status(400).json({ success: false, message: 'Cannot check-in a cancelled registration' });
        }
        if (registration.status === Registration_1.RegistrationStatus.CHECKED_IN) {
            return res.status(400).json({ success: false, message: 'Already checked in' });
        }
        registration.status = Registration_1.RegistrationStatus.CHECKED_IN;
        registration.checkedInAt = new Date();
        await registration.save();
        res.json({ success: true, message: 'Check-in successful', data: registration });
    }
    catch (error) {
        next(error);
    }
});
// Approve registration (for organizer)
router.patch('/:id/approve', auth_1.authenticate, async (req, res, next) => {
    try {
        const registration = await Registration_1.Registration.findById(req.params.id).populate('event');
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        const event = await Event_1.Event.findById(registration.event);
        if (!event || (event.organizer.toString() !== req.userId && req.userRole !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        registration.status = Registration_1.RegistrationStatus.CONFIRMED;
        await registration.save();
        await Ticket_1.Ticket.findByIdAndUpdate(registration.ticket, { $inc: { soldCount: registration.quantity } });
        await Event_1.Event.findByIdAndUpdate(registration.event, { $inc: { registeredCount: registration.quantity } });
        (0, socket_1.sendNotification)(registration.user.toString(), 'registration', 'Registration Approved', `Your registration for ${event.title} has been approved.`, { registrationId: registration._id });
        res.json({ success: true, data: registration });
    }
    catch (error) {
        next(error);
    }
});
// Reject registration
router.patch('/:id/reject', auth_1.authenticate, async (req, res, next) => {
    try {
        const registration = await Registration_1.Registration.findById(req.params.id).populate('event');
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        const event = await Event_1.Event.findById(registration.event);
        if (!event || (event.organizer.toString() !== req.userId && req.userRole !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        registration.status = Registration_1.RegistrationStatus.REJECTED;
        registration.cancellationReason = req.body.reason || 'Registration rejected';
        await registration.save();
        (0, socket_1.sendNotification)(registration.user.toString(), 'registration', 'Registration Rejected', `Your registration for ${event.title} has been rejected. ${req.body.reason ? 'Reason: ' + req.body.reason : ''}`, { registrationId: registration._id });
        res.json({ success: true, data: registration });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=registrations.js.map