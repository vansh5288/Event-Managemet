import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { config } from '../config';
import { Payment, PaymentStatus, PaymentGateway } from '../models/Payment';
import { Registration, RegistrationStatus } from '../models/Registration';
import { Event } from '../models/Event';
import { Ticket } from '../models/Ticket';
import { generateInvoiceNumber } from '../utils/helpers';
import { logger } from '../utils/logger';

let stripe: Stripe | null = null;
let razorpay: Razorpay | null = null;

if (config.stripeSecretKey) {
  stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2023-10-16' as any });
}

if (config.razorpayKeyId && config.razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

export class PaymentService {
  static async createStripeIntent(registrationId: string, userId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) throw new Error('Registration not found');

    const amount = Math.round(registration.totalPrice * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: registration.currency.toLowerCase(),
      metadata: { registrationId: registration._id.toString() },
    });

    const payment = await Payment.create({
      registration: registration._id,
      user: userId,
      event: registration.event,
      amount: registration.totalPrice,
      currency: registration.currency,
      gateway: PaymentGateway.STRIPE,
      status: PaymentStatus.PENDING,
      gatewayOrderId: paymentIntent.id,
      invoiceNumber: generateInvoiceNumber(),
    });

    return { clientSecret: paymentIntent.client_secret, paymentId: payment._id };
  }

  static async createRazorpayOrder(registrationId: string, userId: string) {
    if (!razorpay) {
      throw new Error('Razorpay is not configured');
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) throw new Error('Registration not found');

    const order = await razorpay.orders.create({
      amount: Math.round(registration.totalPrice * 100),
      currency: registration.currency,
      receipt: `receipt_${registration._id}`,
    });

    const payment = await Payment.create({
      registration: registration._id,
      user: userId,
      event: registration.event,
      amount: registration.totalPrice,
      currency: registration.currency,
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.PENDING,
      gatewayOrderId: order.id,
      invoiceNumber: generateInvoiceNumber(),
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency, paymentId: payment._id };
  }

  static async verifyPayment(paymentId: string, gatewayPaymentId: string, gatewaySignature?: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.status = PaymentStatus.SUCCESS;
    payment.gatewayPaymentId = gatewayPaymentId;
    if (gatewaySignature) payment.gatewaySignature = gatewaySignature;
    await payment.save();

    const registration = await Registration.findById(payment.registration);
    if (registration) {
      registration.status = RegistrationStatus.CONFIRMED;
      await registration.save();

      await Ticket.findByIdAndUpdate(registration.ticket, { $inc: { soldCount: registration.quantity } });
      await Event.findByIdAndUpdate(payment.event, { $inc: { registeredCount: registration.quantity } });
    }

    return payment;
  }

  static async processRefund(paymentId: string, amount?: number, reason?: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== PaymentStatus.SUCCESS) throw new Error('Payment is not successful');

    const refundAmount = amount || payment.amount;

    if (payment.gateway === PaymentGateway.STRIPE && stripe && payment.gatewayPaymentId) {
      await stripe.refunds.create({
        payment_intent: payment.gatewayPaymentId,
        amount: Math.round(refundAmount * 100),
      });
    } else if (payment.gateway === PaymentGateway.RAZORPAY && razorpay && payment.gatewayPaymentId) {
      await razorpay.payments.refund(payment.gatewayPaymentId, { amount: Math.round(refundAmount * 100) });
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    return payment;
  }
}

export const paymentService = new PaymentService();
