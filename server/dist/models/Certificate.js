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
exports.Certificate = exports.CertificateStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var CertificateStatus;
(function (CertificateStatus) {
    CertificateStatus["VALID"] = "valid";
    CertificateStatus["REVOKED"] = "revoked";
})(CertificateStatus || (exports.CertificateStatus = CertificateStatus = {}));
const certificateSchema = new mongoose_1.Schema({
    event: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    registration: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Registration', required: true },
    certificateId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: Object.values(CertificateStatus),
        default: CertificateStatus.VALID,
    },
    issuedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    blockchainTxHash: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ user: 1 });
certificateSchema.index({ event: 1 });
exports.Certificate = mongoose_1.default.model('Certificate', certificateSchema);
//# sourceMappingURL=Certificate.js.map