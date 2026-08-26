import mongoose, { Document } from 'mongoose';
export declare enum RegistrationStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CHECKED_IN = "checked_in",
    CANCELLED = "cancelled",
    WAITLISTED = "waitlisted",
    REJECTED = "rejected"
}
export interface IRegistration extends Document {
    event: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    ticket: mongoose.Types.ObjectId;
    status: RegistrationStatus;
    quantity: number;
    totalPrice: number;
    currency: string;
    qrCode: string;
    qrCodeData: string;
    barcode: string;
    checkedInAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Registration: mongoose.Model<IRegistration, {}, {}, {}, mongoose.Document<unknown, {}, IRegistration> & IRegistration & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Registration.d.ts.map