import mongoose, { Document, Schema } from 'mongoose';

export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled',
  WAITLISTED = 'waitlisted',
  REJECTED = 'rejected',
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

const registrationSchema = new Schema<IRegistration>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
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
  },
  { timestamps: true }
);

registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ user: 1, event: 1 });
registrationSchema.index({ user: 1, status: 1 });
registrationSchema.index({ status: 1, createdAt: -1 });

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
