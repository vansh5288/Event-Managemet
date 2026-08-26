import mongoose, { Document } from 'mongoose';
export declare enum EventStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ONGOING = "ongoing",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    POSTPONED = "postponed"
}
export declare enum EventCategory {
    CONFERENCE = "conference",
    WORKSHOP = "workshop",
    SEMINAR = "seminar",
    WEBINAR = "webinar",
    MEETUP = "meetup",
    CONCERT = "concert",
    FESTIVAL = "festival",
    EXHIBITION = "exhibition",
    SPORTS = "sports",
    NETWORKING = "networking",
    CHARITY = "charity",
    OTHER = "other"
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
export declare const Event: mongoose.Model<IEvent, {}, {}, {}, mongoose.Document<unknown, {}, IEvent> & IEvent & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Event.d.ts.map