import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { Payment, PaymentStatus, PaymentGateway } from '../models/Payment';
import { Registration, RegistrationStatus } from '../models/Registration';
import { Event } from '../models/Event';
import { Ticket } from '../models/Ticket';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { config } from '../config';
import { generateInvoiceNumber } from '../utils/helpers';
import { sendPaymentConfirmation } from '../utils/email';
import { sendNotification } from '../socket';

const router = Router();

// Initialize Stripe
let stripe: Stripe | null = null;
if (config.stripeSecretKey) {
  stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2023-10-16' as any });
}

// Initialize Razorpay
let razorpay: Razorpay | null = null;
if (config.razorpayKeyId && config.razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

// Get user's payments
router.get('/my', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await Payment.find({ user: req.userId })
      .populate('event', 'title banner')
      .populate('registration', 'quantity')
      .sort('-createdAt');
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

// Get all payments (admin)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email')
        .populate('event', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query),
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
  } catch (error) {
    next(error);
  }
});

// Create Stripe payment intent
router.post(
  '/create-payment-intent',
  authenticate,
  validate([
    body('registrationId').isMongoId().withMessage('Valid registration ID is required'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!stripe) {
        return res.status(400).json({ success: false, message: 'Stripe is not configured' });
      }

      const { registrationId } = req.body;
      const registration = await Registration.findById(registrationId).populate('event ticket');
      if (!registration) {
        return res.status(404).json({ success: false, message: 'Registration not found' });
      }

      if (registration.status !== RegistrationStatus.PENDING) {
        return res.status(400).json({ success: false, message: 'Registration is not pending' });
      }

      const amount = Math.round(registration.totalPrice * 100); // Convert to cents
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: registration.currency.toLowerCase(),
        metadata: {
          registrationId: registration._id.toString(),
          userId: req.userId!,
        },
      });

      // Create payment record
      const payment = await Payment.create({
        registration: registration._id,
        user: req.userId,
        event: registration.event._id,
        amount: registration.totalPrice,
        currency: registration.currency,
        gateway: PaymentGateway.STRIPE,
        status: PaymentStatus.PENDING,
        gatewayOrderId: paymentIntent.id,
        invoiceNumber: generateInvoiceNumber(),
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment._id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create Razorpay order
router.post(
  '/create-razorpay-order',
  authenticate,
  validate([
    body('registrationId').isMongoId().withMessage('Valid registration ID is required'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!razorpay) {
        return res.status(400).json({ success: false, message: 'Razorpay is not configured' });
      }

      const { registrationId } = req.body;
      const registration = await Registration.findById(registrationId).populate('event ticket');
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
          userId: req.userId!,
        },
      });

      const payment = await Payment.create({
        registration: registration._id,
        user: req.userId,
        event: registration.event._id,
        amount: registration.totalPrice,
        currency: registration.currency,
        gateway: PaymentGateway.RAZORPAY,
        status: PaymentStatus.PENDING,
        gatewayOrderId: order.id,
        invoiceNumber: generateInvoiceNumber(),
      });

      res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: config.razorpayKeyId,
          paymentId: payment._id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify payment
router.post(
  '/verify',
  authenticate,
  validate([
    body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
    body('gatewayPaymentId').notEmpty().withMessage('Gateway payment ID is required'),
    body('gatewaySignature').optional().notEmpty(),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      payment.status = PaymentStatus.SUCCESS;
      payment.gatewayPaymentId = gatewayPaymentId;
      if (gatewaySignature) {
        payment.gatewaySignature = gatewaySignature;
      }
      await payment.save();

      // Update registration status
      await Registration.findByIdAndUpdate(payment.registration, {
        status: RegistrationStatus.CONFIRMED,
      });

      // Update ticket sold count
      const registration = await Registration.findById(payment.registration);
      if (registration) {
        await Ticket.findByIdAndUpdate(registration.ticket, {
          $inc: { soldCount: registration.quantity },
        });

        // Update event registered count
        await Event.findByIdAndUpdate(payment.event, {
          $inc: { registeredCount: registration.quantity },
        });
      }

      // Send confirmation email
      const user = req.user!;
      const event = await Event.findById(payment.event);
      if (event && user.email) {
        sendPaymentConfirmation(
          user.email,
          user.name,
          event.title,
          payment.amount,
          payment.currency
        );
      }

      // Send notification
      sendNotification(
        req.userId!,
        'payment',
        'Payment Successful',
        `Your payment of ${payment.currency} ${payment.amount.toFixed(2)} has been confirmed.`,
        { paymentId: payment._id }
      );

      res.json({ success: true, message: 'Payment verified successfully', data: payment });
    } catch (error) {
      next(error);
    }
  }
);

// Process refund
router.post('/:id/refund', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      return res.status(400).json({ success: false, message: 'Payment is not successful' });
    }

    const { amount, reason } = req.body;
    const refundAmount = amount || payment.amount;

    // Process refund via gateway
    if (payment.gateway === PaymentGateway.STRIPE && stripe && payment.gatewayPaymentId) {
      await stripe.refunds.create({
        payment_intent: payment.gatewayPaymentId,
        amount: Math.round(refundAmount * 100),
      });
    } else if (payment.gateway === PaymentGateway.RAZORPAY && razorpay && payment.gatewayPaymentId) {
      await razorpay.payments.refund(payment.gatewayPaymentId, {
        amount: Math.round(refundAmount * 100),
      });
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    // Cancel registration
    const registration = await Registration.findById(payment.registration);
    if (registration) {
      registration.status = RegistrationStatus.CANCELLED;
      registration.cancelledAt = new Date();
      registration.cancellationReason = reason || 'Refund processed';
      await registration.save();

      // Decrement ticket sold count
      await Ticket.findByIdAndUpdate(registration.ticket, {
        $inc: { soldCount: -registration.quantity },
      });

      // Decrement event registered count
      await Event.findByIdAndUpdate(payment.event, {
        $inc: { registeredCount: -registration.quantity },
      });
    }

    sendNotification(
      req.userId!,
      'payment',
      'Refund Processed',
      `Your refund of ${payment.currency} ${refundAmount.toFixed(2)} has been processed.`,
      { paymentId: payment._id }
    );

    res.json({ success: true, message: 'Refund processed successfully', data: payment });
  } catch (error) {
    next(error);
  }
});

export default router;
