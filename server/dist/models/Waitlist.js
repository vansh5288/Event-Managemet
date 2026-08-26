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
exports.Waitlist = exports.WaitlistStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var WaitlistStatus;
(function (WaitlistStatus) {
    WaitlistStatus["WAITING"] = "waiting";
    WaitlistStatus["INVITED"] = "invited";
    WaitlistStatus["REGISTERED"] = "registered";
    WaitlistStatus["EXPIRED"] = "expired";
    WaitlistStatus["CANCELLED"] = "cancelled";
})(WaitlistStatus || (exports.WaitlistStatus = WaitlistStatus = {}));
const waitlistSchema = new mongoose_1.Schema({
    event: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketType: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ticket' },
    status: {
        type: String,
        enum: Object.values(WaitlistStatus),
        default: WaitlistStatus.WAITING,
    },
    position: { type: Number, required: true },
    invitedAt: { type: Date },
    expiresAt: { type: Date },
}, { timestamps: true });
waitlistSchema.index({ event: 1, status: 1, position: 1 });
waitlistSchema.index({ user: 1, event: 1 }, { unique: true });
exports.Waitlist = mongoose_1.default.model('Waitlist', waitlistSchema);
//# sourceMappingURL=Waitlist.js.map