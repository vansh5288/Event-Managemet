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
exports.Registration = exports.RegistrationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["PENDING"] = "pending";
    RegistrationStatus["CONFIRMED"] = "confirmed";
    RegistrationStatus["CHECKED_IN"] = "checked_in";
    RegistrationStatus["CANCELLED"] = "cancelled";
    RegistrationStatus["WAITLISTED"] = "waitlisted";
    RegistrationStatus["REJECTED"] = "rejected";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
const registrationSchema = new mongoose_1.Schema({
    event: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    ticket: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    status: {
        type: String,
        enum: Object.values(RegistrationStatus),
        default: RegistrationStatus.PENDING,
    },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    qrCode: { type: String },
    qrCodeData: { type: String },
    barcode: { type: String },
    checkedInAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    notes: { type: String },
}, { timestamps: true });
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ user: 1, event: 1 });
registrationSchema.index({ user: 1, status: 1 });
registrationSchema.index({ status: 1, createdAt: -1 });
exports.Registration = mongoose_1.default.model('Registration', registrationSchema);
//# sourceMappingURL=Registration.js.map