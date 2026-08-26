import mongoose, { Document, Schema } from 'mongoose';

export enum SponsorTier {
  PLATINUM = 'platinum',
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze',
  MEDIA = 'media',
}

export interface ISponsor extends Document {
  event: mongoose.Types.ObjectId;
  name: string;
  logo: string;
  website: string;
  description: string;
  tier: SponsorTier;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sponsorSchema = new Schema<ISponsor>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
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
  },
  { timestamps: true }
);

sponsorSchema.index({ event: 1, tier: 1 });

export const Sponsor = mongoose.model<ISponsor>('Sponsor', sponsorSchema);
