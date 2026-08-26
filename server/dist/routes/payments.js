"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
const razorpay_1 = __importDefault(require("razorpay"));
const Payment_1 = require("../models/Payment");
const Registration_1 = require("../models/Registration");
const Event_1 = require("../models/Event");
const Ticket_1 = require("../models/Ticket");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const config_1 = require("../config");
const helpers_1 = require("../utils/helpers");
const email_1 = require("../utils/email");
const socket_1 = require("../socket");
const router = (0, express_1.Router)();
// Initialize Stripe
let stripe = null;
if (config_1.config.stripeSecretKey) {
    stripe = new stripe_1.default(config_1.config.stripeSecretKey, { apiVersion: '2023-10-16' });
}
// Initialize Razorpay
let razorpay = null;
if (config_1.config.razorpayKeyId && config_1.config.razorpayKeySecret) {
    razorpay = new razorpay_1.default({
        key_id: config_1.config.razorpayKeyId,
        key_secret: config_1.config.razorpayKeySecret,
    });
}
// Get user's payments
router.get('/my', auth_1.authenticate, async (req, res, next) => {
    try {
        const payments = await Payment_1.Payment.find({ user: req.userId })
            .populate('event', 'title banner')
            .populate('registration', 'quantity')
            .sort('-createdAt');
        res.json({ success: true, data: payments });
    }
    catch (error) {
        next(error);
    }
});
// Get all payments (admin)
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { page = '1', limit = '20', status } = req.query;
        const query = {};
        if (status)
            query.status = status;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [payments, total] = await Promise.all([
            Payment_1.Payment.find(query)
                .populate('user', 'name email')
                .populate('event', 'title')
                .sort('-createdAt')
                .skip(skip)
                .limit(limitNum),
            Payment_1.Payment.countDocuments(query),
        ]);
        res.json({
            success: true,
            data: payments,
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
// Create Stripe payment intent
router.post('/create-payment-intent', auth_1.authenticate, (0, validate_1.validate)([
    (0, express_validator_1.body)('registrationId').isMongoId().withMessage('Valid registration ID is required'),
]), async (req, res, next) => {
    try {
        if (!stripe) {
            return res.status(400).json({ success: false, message: 'Stripe is not configured' });
        }
        const { registrationId } = req.body;
        const registration = await Registration_1.Registration.findById(registrationId).populate('event ticket');
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        if (registration.status !== Registration_1.RegistrationStatus.PENDING) {
            return res.status(400).json({ success: false, message: 'Registration is not pending' });
        }
        const amount = Math.round(registration.totalPrice * 100); // Convert to cents
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: registration.currency.toLowerCase(),
            metadata: {
                registrationId: registration._id.toString(),
                userId: req.userId,
            },
        });
        // Create payment record
        const payment = await Payment_1.Payment.create({
            registration: registration._id,
            user: req.userId,
            event: registration.event._id,
            amount: registration.totalPrice,
            currency: registration.currency,
            gateway: Payment_1.PaymentGateway.STRIPE,
            status: Payment_1.PaymentStatus.PENDING,
            gatewayOrderId: paymentIntent.id,
            invoiceNumber: (0, helpers_1.generateInvoiceNumber)(),
        });
        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentId: payment._id,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// Create Razorpay order
router.post('/create-razorpay-order', auth_1.authenticate, (0, validate_1.validate)([
    (0, express_validator_1.body)('registrationId').isMongoId().withMessage('Valid registration ID is required'),
]), async (req, res, next) => {
    try {
        if (!razorpay) {
            return res.status(400).json({ success: false, message: 'Razorpay is not configured' });
        }
        const { registrationId } = req.body;
        const registration = await Registration_1.Registration.findById(registrationId).populate('event ticket');
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        const amount = Math.round(registration.totalPrice * 100); // Convert to paise
        const order = await razorpay.orders.create({
            amount,
            currency: registration.currency,
            receipt: `receipt_${registration._id}`,
            notes: {
                registrationId: registration._id.toString(),
                userId: req.userId,
            },
        });
        const payment = await Payment_1.Payment.create({
            registration: registration._id,
            user: req.userId,
            event: registration.event._id,
            amount: registration.totalPrice,
            currency: registration.currency,
            gateway: Payment_1.PaymentGateway.RAZORPAY,
            status: Payment_1.PaymentStatus.PENDING,
            gatewayOrderId: order.id,
            invoiceNumber: (0, helpers_1.generateInvoiceNumber)(),
        });
        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: config_1.config.razorpayKeyId,
                paymentId: payment._id,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// Verify payment
router.post('/verify', auth_1.authenticate, (0, validate_1.validate)([
    (0, express_validator_1.body)('paymentId').isMongoId().withMessage('Valid payment ID is required'),
    (0, express_validator_1.body)('gatewayPaymentId').notEmpty().withMessage('Gateway payment ID is required'),
    (0, express_validator_1.body)('gatewaySignature').optional().notEmpty(),
]), async (req, res, next) => {
    try {
        const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;
        const payment = await Payment_1.Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        payment.status = Payment_1.PaymentStatus.SUCCESS;
        payment.gatewayPaymentId = gatewayPaymentId;
        if (gatewaySignature) {
            payment.gatewaySignature = gatewaySignature;
        }
        await payment.save();
        // Update registration status
        await Registration_1.Registration.findByIdAndUpdate(payment.registration, {
            status: Registration_1.RegistrationStatus.CONFIRMED,
        });
        // Update ticket sold count
        const registration = await Registration_1.Registration.findById(payment.registration);
        if (registration) {
            await Ticket_1.Ticket.findByIdAndUpdate(registration.ticket, {
                $inc: { soldCount: registration.quantity },
            });
            // Update event registered count
            await Event_1.Event.findByIdAndUpdate(payment.event, {
                $inc: { registeredCount: registration.quantity },
            });
        }
        // Send confirmation email
        const user = req.user;
        const event = await Event_1.Event.findById(payment.event);
        if (event && user.email) {
            (0, email_1.sendPaymentConfirmation)(user.email, user.name, event.title, payment.amount, payment.currency);
        }
        // Send notification
        (0, socket_1.sendNotification)(req.userId, 'payment', 'Payment Successful', `Your payment of ${payment.currency} ${payment.amount.toFixed(2)} has been confirmed.`, { paymentId: payment._id });
        res.json({ success: true, message: 'Payment verified successfully', data: payment });
    }
    catch (error) {
        next(error);
    }
});
// Process refund
router.post('/:id/refund', auth_1.authenticate, async (req, res, next) => {
    try {
        const payment = await Payment_1.Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        if (payment.status !== Payment_1.PaymentStatus.SUCCESS) {
            return res.status(400).json({ success: false, message: 'Payment is not successful' });
        }
        const { amount, reason } = req.body;
        const refundAmount = amount || payment.amount;
        // Process refund via gateway
        if (payment.gateway === Payment_1.PaymentGateway.STRIPE && stripe && payment.gatewayPaymentId) {
            await stripe.refunds.create({
                payment_intent: payment.gatewayPaymentId,
                amount: Math.round(refundAmount * 100),
            });
        }
        else if (payment.gateway === Payment_1.PaymentGateway.RAZORPAY && razorpay && payment.gatewayPaymentId) {
            await razorpay.payments.refund(payment.gatewayPaymentId, {
                amount: Math.round(refundAmount * 100),
            });
        }
        payment.status = Payment_1.PaymentStatus.REFUNDED;
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        payment.refundedAt = new Date();
        await payment.save();
        // Cancel registration
        const registration = await Registration_1.Registration.findById(payment.registration);
        if (registration) {
            registration.status = Registration_1.RegistrationStatus.CANCELLED;
            registration.cancelledAt = new Date();
            registration.cancellationReason = reason || 'Refund processed';
            await registration.save();
            // Decrement ticket sold count
            await Ticket_1.Ticket.findByIdAndUpdate(registration.ticket, {
                $inc: { soldCount: -registration.quantity },
            });
            // Decrement event registered count
            await Event_1.Event.findByIdAndUpdate(payment.event, {
                $inc: { registeredCount: -registration.quantity },
            });
        }
        (0, socket_1.sendNotification)(req.userId, 'payment', 'Refund Processed', `Your refund of ${payment.currency} ${refundAmount.toFixed(2)} has been processed.`, { paymentId: payment._id });
        res.json({ success: true, message: 'Refund processed successfully', data: payment });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map