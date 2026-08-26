import mongoose, { Document } from 'mongoose';
export declare enum TicketType {
    FREE = "free",
    PAID = "paid",
    VIP = "vip",
    STUDENT = "student",
    EARLY_BIRD = "early_bird",
    GROUP = "group"
}
export declare enum TicketStatus {
    AVAILABLE = "available",
    SOLD = "sold",
    RESERVED = "reserved",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export interface ITicket extends Document {
    event: mongoose.Types.ObjectId;
    type: TicketType;
    name: string;
    description: string;
    price: number;
    currency: string;
    quantity: number;
    soldCount: number;
    maxPerOrder: number;
    status: TicketStatus;
    benefits: string[];
    saleStart: Date;
    saleEnd: Date;
    isTransferable: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Ticket: mongoose.Model<ITicket, {}, {}, {}, mongoose.Document<unknown, {}, ITicket> & ITicket & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Ticket.d.ts.map