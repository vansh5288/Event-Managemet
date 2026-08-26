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
exports.Ticket = exports.TicketStatus = exports.TicketType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var TicketType;
(function (TicketType) {
    TicketType["FREE"] = "free";
    TicketType["PAID"] = "paid";
    TicketType["VIP"] = "vip";
    TicketType["STUDENT"] = "student";
    TicketType["EARLY_BIRD"] = "early_bird";
    TicketType["GROUP"] = "group";
})(TicketType || (exports.TicketType = TicketType = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["AVAILABLE"] = "available";
    TicketStatus["SOLD"] = "sold";
    TicketStatus["RESERVED"] = "reserved";
    TicketStatus["CANCELLED"] = "cancelled";
    TicketStatus["REFUNDED"] = "refunded";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
const ticketSchema = new mongoose_1.Schema({
    event: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true },
    type: { type: String, enum: Object.values(TicketType), required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    quantity: { type: Number, required: true },
    soldCount: { type: Number, default: 0 },
    maxPerOrder: { type: Number, default: 5 },
    status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.AVAILABLE },
    benefits: [{ type: String }],
    saleStart: { type: Date },
    saleEnd: { type: Date },
    isTransferable: { type: Boolean, default: false },
}, { timestamps: true });
ticketSchema.index({ event: 1, type: 1 });
ticketSchema.index({ event: 1, status: 1 });
exports.Ticket = mongoose_1.default.model('Ticket', ticketSchema);
//# sourceMappingURL=Ticket.js.map