// ---- Enums ----

export const UserRoles = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  PARTICIPANT: 'participant',
  VOLUNTEER: 'volunteer',
  SPONSOR: 'sponsor',
  JUDGE: 'judge',
  SPEAKER: 'speaker',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export const EventStatuses = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
} as const;

export type EventStatus = (typeof EventStatuses)[keyof typeof EventStatuses];

export const EventCategories = {
  CONFERENCE: 'conference',
  WORKSHOP: 'workshop',
  SEMINAR: 'seminar',
  WEBINAR: 'webinar',
  MEETUP: 'meetup',
  CONCERT: 'concert',
  FESTIVAL: 'festival',
  EXHIBITION: 'exhibition',
  SPORTS: 'sports',
  NETWORKING: 'networking',
  CHARITY: 'charity',
  OTHER: 'other',
} as const;

export type EventCategory = (typeof EventCategories)[keyof typeof EventCategories];

export const TicketTypes = {
  FREE: 'free',
  PAID: 'paid',
  VIP: 'vip',
  STUDENT: 'student',
  EARLY_BIRD: 'early_bird',
} as const;

export type TicketType = (typeof TicketTypes)[keyof typeof TicketTypes];

export const RegistrationStatuses = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;

export type RegistrationStatus = (typeof RegistrationStatuses)[keyof typeof RegistrationStatuses];

export const PaymentGateways = {
  STRIPE: 'stripe',
  RAZORPAY: 'razorpay',
} as const;

export type PaymentGateway = (typeof PaymentGateways)[keyof typeof PaymentGateways];

export const PaymentStatuses = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PaymentStatuses)[keyof typeof PaymentStatuses];

export const SponsorTiers = {
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BRONZE: 'bronze',
  MEDIA: 'media',
} as const;

export type SponsorTier = (typeof SponsorTiers)[keyof typeof SponsorTiers];

export const NotificationTypes = {
  REGISTRATION: 'registration',
  PAYMENT: 'payment',
  REMINDER: 'reminder',
  CERTIFICATE: 'certificate',
  EVENT_UPDATE: 'event_update',
  GENERAL: 'general',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

export const SessionTypes = {
  KEYNOTE: 'keynote',
  WORKSHOP: 'workshop',
  PANEL: 'panel',
  TALK: 'talk',
  NETWORKING: 'networking',
  BREAK: 'break',
  OTHER: 'other',
} as const;

export type SessionType = (typeof SessionTypes)[keyof typeof SessionTypes];

export const WaitlistStatuses = {
  WAITING: 'waiting',
  INVITED: 'invited',
  REGISTERED: 'registered',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type WaitlistStatus = (typeof WaitlistStatuses)[keyof typeof WaitlistStatuses];

// ---- Entities ----

export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  phone?: string;
  organization?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  socialLinks?: {
    website?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    darkMode: boolean;
  };
  walletAddress?: string;
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  type?: 'online' | 'physical' | 'hybrid';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  organizer: string | User;
  category: string;
  tags: string[];
  status: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  timezone?: string;
  location: Location;
  venue?: string | Venue;
  isVirtual: boolean;
  virtualLink?: string;
  isPrivate: boolean;
  isRecurring: boolean;
  recurringPattern?: string;
  capacity: number;
  waitlistCapacity?: number;
  registeredCount: number;
  waitlistCount: number;
  banner?: string;
  gallery: string[];
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  speakers: string[];
  sponsors: string[];
  volunteers: string[];
  sessions: string[];
  ticketTypes: string[];
  visibility: string;
  featured?: boolean;
  views: number;
  averageRating?: number;
  totalReviews?: number;
  tagsList?: string[];
  highlights?: string[];
  faq?: { question: string; answer: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  _id: string;
  event: string | Event;
  name: string;
  type: string;
  price: number;
  currency?: string;
  quantity: number;
  soldCount: number;
  description?: string;
  benefits: string[];
  status: string;
  maxPerOrder?: number;
  salesStart?: Date;
  salesEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Registration {
  _id: string;
  event: string | Event;
  user: string | User;
  ticket: string | Ticket;
  quantity: number;
  totalPrice: number;
  currency: string;
  status: string;
  qrCodeData: string;
  barcode?: string;
  checkedInAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  _id: string;
  registration: string | Registration;
  user: string | User;
  event: string | Event;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  invoiceNumber?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certificate {
  _id: string;
  event: string | Event;
  user: string | User;
  registration: string | Registration;
  certificateId: string;
  title: string;
  issuedAt: Date;
  verifiedAt?: Date;
  blockchainTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  user: string | User;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface Venue {
  _id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number };
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

export interface Sponsor {
  _id: string;
  event: string | Event;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  tier: SponsorTier;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  amount: number;
  currency?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  chatRoom: string;
  sender: string | User;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  isRead: boolean;
  readAt?: Date;
  isTyping?: boolean;
  createdAt: Date;
}

export interface ChatRoom {
  _id: string;
  name: string;
  type: 'direct' | 'event' | 'group';
  participants: string[] | User[];
  event?: string | Event;
  lastMessage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionItem {
  _id: string;
  event: string | Event;
  title: string;
  description?: string;
  speaker?: string | User;
  startTime: Date;
  endTime: Date;
  venue?: string;
  type: SessionType;
  track?: string;
  capacity?: number;
  materials: string[];
  recordingUrl?: string;
  slidesUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitlistEntry {
  _id: string;
  event: string | Event;
  user: string | User;
  ticketType?: string | Ticket;
  status: WaitlistStatus;
  position: number;
  invitedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  _id: string;
  event: string | Event;
  user: string | User;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  cancelledEvents: number;
  todayEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  averageRating: number;
  totalSponsors: number;
  totalVolunteers: number;
  totalCertificates: number;
  totalUsers?: number;
  checkInRate: number;
  paymentSuccessRate?: number;
}

export interface DashboardCharts {
  eventGrowth: { _id: string; count: number }[];
  categoryDistribution: { _id: string; count: number }[];
  revenueTrend: { _id: string; total: number }[];
  registrationTrend: { _id: string; count: number }[];
  topEvents: { title: string; registeredCount: number; capacity: number; category: string; rating: number }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

