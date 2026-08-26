import mongoose, { Document } from 'mongoose';
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum PaymentGateway {
    STRIPE = "stripe",
    RAZORPAY = "razorpay"
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
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment> & IPayment & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Payment.d.ts.map