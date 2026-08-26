import mongoose, { Document } from 'mongoose';
export declare enum WaitlistStatus {
    WAITING = "waiting",
    INVITED = "invited",
    REGISTERED = "registered",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export interface IWaitlist extends Document {
    event: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    ticketType?: mongoose.Types.ObjectId;
    status: WaitlistStatus;
    position: number;
    invitedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Waitlist: mongoose.Model<IWaitlist, {}, {}, {}, mongoose.Document<unknown, {}, IWaitlist> & IWaitlist & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Waitlist.d.ts.map