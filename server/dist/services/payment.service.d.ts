export declare class PaymentService {
    static createStripeIntent(registrationId: string, userId: string): Promise<{
        clientSecret: string | null;
        paymentId: any;
    }>;
    static createRazorpayOrder(registrationId: string, userId: string): Promise<{
        orderId: string;
        amount: string | number;
        currency: string;
        paymentId: any;
    }>;
    static verifyPayment(paymentId: string, gatewayPaymentId: string, gatewaySignature?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Payment").IPayment> & import("../models/Payment").IPayment & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    static processRefund(paymentId: string, amount?: number, reason?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Payment").IPayment> & import("../models/Payment").IPayment & {
        _id: import("mongoose").Types.ObjectId;
    }>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map