import mongoose, { Document } from 'mongoose';
export declare enum SponsorTier {
    PLATINUM = "platinum",
    GOLD = "gold",
    SILVER = "silver",
    BRONZE = "bronze",
    MEDIA = "media"
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
export declare const Sponsor: mongoose.Model<ISponsor, {}, {}, {}, mongoose.Document<unknown, {}, ISponsor> & ISponsor & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Sponsor.d.ts.map