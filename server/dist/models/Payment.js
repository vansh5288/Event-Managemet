"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = exports.PaymentGateway = exports.PaymentStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentGateway;
(function (PaymentGateway) {
    PaymentGateway["STRIPE"] = "stripe";
    PaymentGateway["RAZORPAY"] = "razorpay";
})(PaymentGateway || (exports.PaymentGateway = PaymentGateway = {}));
const paymentSchema = new mongoose_1.Schema({
    registration: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Registration', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
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
}, { timestamps: true });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ event: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });
exports.Payment = mongoose_1.default.model('Payment', paymentSchema);
//# sourceMappingURL=Payment.js.map