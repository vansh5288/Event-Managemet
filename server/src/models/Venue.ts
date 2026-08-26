import mongoose, { Document, Schema } from 'mongoose';

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

const venueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: [true, 'Venue name is required'], trim: true },
    description: { type: String, maxlength: 1000 },
    address: { type: String, required: [true, 'Address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String },
    country: { type: String, required: [true, 'Country is required'] },
    zipCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    capacity: { type: Number, required: [true, 'Capacity is required'] },
    amenities: [{ type: String }],
    images: [{ type: String }],
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

venueSchema.index({ city: 1, country: 1 });
venueSchema.index({ isActive: 1 });

export const Venue = mongoose.model<IVenue>('Venue', venueSchema);
