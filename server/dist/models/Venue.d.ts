import mongoose, { Document } from 'mongoose';
export interface IVenue extends Document {
    name: string;
    description?: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    capacity: number;
    amenities: string[];
    images: string[];
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Venue: mongoose.Model<IVenue, {}, {}, {}, mongoose.Document<unknown, {}, IVenue> & IVenue & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Venue.d.ts.map