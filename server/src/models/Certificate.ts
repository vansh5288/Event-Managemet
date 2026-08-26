import mongoose, { Document, Schema } from 'mongoose';

export enum CertificateStatus {
  VALID = 'valid',
  REVOKED = 'revoked',
}

export interface ICertificate extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  registration: mongoose.Types.ObjectId;
  certificateId: string;
  title: string;
  description?: string;
  status: CertificateStatus;
  issuedAt: Date;
  verifiedAt?: Date;
  blockchainTxHash?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
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
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ user: 1 });
certificateSchema.index({ event: 1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
