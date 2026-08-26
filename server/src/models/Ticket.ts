import mongoose, { Document, Schema } from 'mongoose';

export enum TicketType {
  FREE = 'free',
  PAID = 'paid',
  VIP = 'vip',
  STUDENT = 'student',
  EARLY_BIRD = 'early_bird',
  GROUP = 'group',
}

export enum TicketStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface ITicket extends Document {
  event: mongoose.Types.ObjectId;
  type: TicketType;
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  soldCount: number;
  maxPerOrder: number;
  status: TicketStatus;
  benefits: string[];
  saleStart: Date;
  saleEnd: Date;
  isTransferable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    type: { type: String, enum: Object.values(TicketType), required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    quantity: { type: Number, required: true },
    soldCount: { type: Number, default: 0 },
    maxPerOrder: { type: Number, default: 5 },
    status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.AVAILABLE },
    benefits: [{ type: String }],
    saleStart: { type: Date },
    saleEnd: { type: Date },
    isTransferable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ticketSchema.index({ event: 1, type: 1 });
ticketSchema.index({ event: 1, status: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
