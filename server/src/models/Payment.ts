import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
}

export interface IPayment extends Document {
  registration: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  invoiceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    gateway: { type: String, enum: Object.values(PaymentGateway), required: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    gatewayPaymentId: { type: String },
    gatewayOrderId: { type: String },
    gatewaySignature: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundedAt: { type: Date },
    invoiceNumber: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ event: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
