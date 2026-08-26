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
exports.Sponsor = exports.SponsorTier = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var SponsorTier;
(function (SponsorTier) {
    SponsorTier["PLATINUM"] = "platinum";
    SponsorTier["GOLD"] = "gold";
    SponsorTier["SILVER"] = "silver";
    SponsorTier["BRONZE"] = "bronze";
    SponsorTier["MEDIA"] = "media";
})(SponsorTier || (exports.SponsorTier = SponsorTier = {}));
const sponsorSchema = new mongoose_1.Schema({
    event: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    logo: { type: String },
    website: { type: String },
    description: { type: String },
    tier: { type: String, enum: Object.values(SponsorTier), default: SponsorTier.BRONZE },
    contactName: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
sponsorSchema.index({ event: 1, tier: 1 });
exports.Sponsor = mongoose_1.default.model('Sponsor', sponsorSchema);
//# sourceMappingURL=Sponsor.js.map