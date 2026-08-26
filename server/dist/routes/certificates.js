"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Certificate_1 = require("../models/Certificate");
const Registration_1 = require("../models/Registration");
const auth_1 = require("../middleware/auth");
const helpers_1 = require("../utils/helpers");
const router = (0, express_1.Router)();
router.get('/my', auth_1.authenticate, async (req, res, next) => {
    try {
        const certificates = await Certificate_1.Certificate.find({ user: req.userId })
            .populate('event', 'title startDate endDate')
            .sort('-issuedAt');
        res.json({ success: true, data: certificates });
    }
    catch (error) {
        next(error);
    }
});
router.get('/event/:eventId', auth_1.authenticate, async (req, res, next) => {
    try {
        const certificates = await Certificate_1.Certificate.find({ event: req.params.eventId })
            .populate('user', 'name email')
            .sort('-issuedAt');
        res.json({ success: true, data: certificates });
    }
    catch (error) {
        next(error);
    }
});
router.post('/generate', auth_1.authenticate, async (req, res, next) => {
    try {
        const { registrationId } = req.body;
        const registration = await Registration_1.Registration.findById(registrationId).populate('event');
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        const certificate = await Certificate_1.Certificate.create({
            event: registration.event._id,
            user: registration.user,
            registration: registration._id,
            certificateId: (0, helpers_1.generateCertificateId)(),
            title: `Certificate of Attendance - ${registration.event.title}`,
            issuedAt: new Date(),
        });
        res.status(201).json({ success: true, data: certificate });
    }
    catch (error) {
        next(error);
    }
});
router.get('/verify/:certificateId', async (req, res, next) => {
    try {
        const certificate = await Certificate_1.Certificate.findOne({ certificateId: req.params.certificateId })
            .populate('user', 'name')
            .populate('event', 'title startDate endDate');
        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }
        res.json({ success: true, data: certificate });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=certificates.js.map