"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const razorpay_1 = __importDefault(require("razorpay"));
const config_1 = require("../config");
const Payment_1 = require("../models/Payment");
const Registration_1 = require("../models/Registration");
const Event_1 = require("../models/Event");
const Ticket_1 = require("../models/Ticket");
const helpers_1 = require("../utils/helpers");
let stripe = null;
let razorpay = null;
if (config_1.config.stripeSecretKey) {
    stripe = new stripe_1.default(config_1.config.stripeSecretKey, { apiVersion: '2023-10-16' });
}
if (config_1.config.razorpayKeyId && config_1.config.razorpayKeySecret) {
    razorpay = new razorpay_1.default({
        key_id: config_1.config.razorpayKeyId,
        key_secret: config_1.config.razorpayKeySecret,
    });
}
class PaymentService {
    static async createStripeIntent(registrationId, userId) {
        if (!stripe) {
            throw new Error('Stripe is not configured');
        }
        const registration = await Registration_1.Registration.findById(registrationId);
        if (!registration)
            throw new Error('Registration not found');
        const amount = Math.round(registration.totalPrice * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: registration.currency.toLowerCase(),
            metadata: { registrationId: registration._id.toString() },
        });
        const payment = await Payment_1.Payment.create({
            registration: registration._id,
            user: userId,
            event: registration.event,
            amount: registration.totalPrice,
            currency: registration.currency,
            gateway: Payment_1.PaymentGateway.STRIPE,
            status: Payment_1.PaymentStatus.PENDING,
            gatewayOrderId: paymentIntent.id,
            invoiceNumber: (0, helpers_1.generateInvoiceNumber)(),
        });
        return { clientSecret: paymentIntent.client_secret, paymentId: payment._id };
    }
    static async createRazorpayOrder(registrationId, userId) {
        if (!razorpay) {
            throw new Error('Razorpay is not configured');
        }
        const registration = await Registration_1.Registration.findById(registrationId);
        if (!registration)
            throw new Error('Registration not found');
        const order = await razorpay.orders.create({
            amount: Math.round(registration.totalPrice * 100),
            currency: registration.currency,
            receipt: `receipt_${registration._id}`,
        });
        const payment = await Payment_1.Payment.create({
            registration: registration._id,
            user: userId,
            event: registration.event,
            amount: registration.totalPrice,
            currency: registration.currency,
            gateway: Payment_1.PaymentGateway.RAZORPAY,
            status: Payment_1.PaymentStatus.PENDING,
            gatewayOrderId: order.id,
            invoiceNumber: (0, helpers_1.generateInvoiceNumber)(),
        });
        return { orderId: order.id, amount: order.amount, currency: order.currency, paymentId: payment._id };
    }
    static async verifyPayment(paymentId, gatewayPaymentId, gatewaySignature) {
        const payment = await Payment_1.Payment.findById(paymentId);
        if (!payment)
            throw new Error('Payment not found');
        payment.status = Payment_1.PaymentStatus.SUCCESS;
        payment.gatewayPaymentId = gatewayPaymentId;
        if (gatewaySignature)
            payment.gatewaySignature = gatewaySignature;
        await payment.save();
        const registration = await Registration_1.Registration.findById(payment.registration);
        if (registration) {
            registration.status = Registration_1.RegistrationStatus.CONFIRMED;
            await registration.save();
            await Ticket_1.Ticket.findByIdAndUpdate(registration.ticket, { $inc: { soldCount: registration.quantity } });
            await Event_1.Event.findByIdAndUpdate(payment.event, { $inc: { registeredCount: registration.quantity } });
        }
        return payment;
    }
    static async processRefund(paymentId, amount, reason) {
        const payment = await Payment_1.Payment.findById(paymentId);
        if (!payment)
            throw new Error('Payment not found');
        if (payment.status !== Payment_1.PaymentStatus.SUCCESS)
            throw new Error('Payment is not successful');
        const refundAmount = amount || payment.amount;
        if (payment.gateway === Payment_1.PaymentGateway.STRIPE && stripe && payment.gatewayPaymentId) {
            await stripe.refunds.create({
                payment_intent: payment.gatewayPaymentId,
                amount: Math.round(refundAmount * 100),
            });
        }
        else if (payment.gateway === Payment_1.PaymentGateway.RAZORPAY && razorpay && payment.gatewayPaymentId) {
            await razorpay.payments.refund(payment.gatewayPaymentId, { amount: Math.round(refundAmount * 100) });
        }
        payment.status = Payment_1.PaymentStatus.REFUNDED;
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        payment.refundedAt = new Date();
        await payment.save();
        return payment;
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map