"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.EventCategory = exports.EventStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var EventStatus;
(function (EventStatus) {
    EventStatus["DRAFT"] = "draft";
    EventStatus["PUBLISHED"] = "published";
    EventStatus["ONGOING"] = "ongoing";
    EventStatus["COMPLETED"] = "completed";
    EventStatus["CANCELLED"] = "cancelled";
    EventStatus["POSTPONED"] = "postponed";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var EventCategory;
(function (EventCategory) {
    EventCategory["CONFERENCE"] = "conference";
    EventCategory["WORKSHOP"] = "workshop";
    EventCategory["SEMINAR"] = "seminar";
    EventCategory["WEBINAR"] = "webinar";
    EventCategory["MEETUP"] = "meetup";
    EventCategory["CONCERT"] = "concert";
    EventCategory["FESTIVAL"] = "festival";
    EventCategory["EXHIBITION"] = "exhibition";
    EventCategory["SPORTS"] = "sports";
    EventCategory["NETWORKING"] = "networking";
    EventCategory["CHARITY"] = "charity";
    EventCategory["OTHER"] = "other";
})(EventCategory || (exports.EventCategory = EventCategory = {}));
const eventSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
    venue: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Venue' },
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
    speakers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    sponsors: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Sponsor' }],
    volunteers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    sessions: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Session' }],
    ticketTypes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Ticket' }],
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
}, { timestamps: true });
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'location.city': 1, 'location.country': 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ title: 'text', description: 'text', shortDescription: 'text' });
exports.Event = mongoose_1.default.model('Event', eventSchema);
//# sourceMappingURL=Event.js.map