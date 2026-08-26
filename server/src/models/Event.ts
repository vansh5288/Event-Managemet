import mongoose, { Document, Schema } from 'mongoose';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum EventCategory {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  WEBINAR = 'webinar',
  MEETUP = 'meetup',
  CONCERT = 'concert',
  FESTIVAL = 'festival',
  EXHIBITION = 'exhibition',
  SPORTS = 'sports',
  NETWORKING = 'networking',
  CHARITY = 'charity',
  OTHER = 'other',
}

export interface IEvent extends Document {
  title: string;
  description: string;
  shortDescription: string;
  category: EventCategory;
  tags: string[];
  status: EventStatus;
  organizer: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  timezone: string;
  location: {
    type: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  venue: mongoose.Types.ObjectId;
  isVirtual: boolean;
  virtualLink?: string;
  isPrivate: boolean;
  isRecurring: boolean;
  recurringPattern?: string;
  capacity: number;
  waitlistCapacity: number;
  registeredCount: number;
  waitlistCount: number;
  banner?: string;
  gallery: string[];
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  speakers: mongoose.Types.ObjectId[];
  sponsors: mongoose.Types.ObjectId[];
  volunteers: mongoose.Types.ObjectId[];
  sessions: mongoose.Types.ObjectId[];
  ticketTypes: mongoose.Types.ObjectId[];
  featured: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    category: {
      type: String,
      enum: Object.values(EventCategory),
      required: [true, 'Event category is required'],
    },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.DRAFT,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    registrationDeadline: { type: Date },
    timezone: { type: String, default: 'UTC' },
    location: {
      type: { type: String, enum: ['online', 'physical', 'hybrid'], default: 'physical' },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue' },
    isVirtual: { type: Boolean, default: false },
    virtualLink: { type: String },
    isPrivate: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: { type: String },
    capacity: { type: Number, required: [true, 'Capacity is required'] },
    waitlistCapacity: { type: Number, default: 0 },
    registeredCount: { type: Number, default: 0 },
    waitlistCount: { type: Number, default: 0 },
    banner: { type: String },
    gallery: [{ type: String }],
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    speakers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sponsors: [{ type: Schema.Types.ObjectId, ref: 'Sponsor' }],
    volunteers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
    ticketTypes: [{ type: Schema.Types.ObjectId, ref: 'Ticket' }],
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'location.city': 1, 'location.country': 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ title: 'text', description: 'text', shortDescription: 'text' });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
