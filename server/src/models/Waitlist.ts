import mongoose, { Document, Schema } from 'mongoose';

export enum WaitlistStatus {
  WAITING = 'waiting',
  INVITED = 'invited',
  REGISTERED = 'registered',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface IWaitlist extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  ticketType?: mongoose.Types.ObjectId;
  status: WaitlistStatus;
  position: number;
  invitedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new Schema<IWaitlist>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketType: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    status: {
      type: String,
      enum: Object.values(WaitlistStatus),
      default: WaitlistStatus.WAITING,
    },
    position: { type: Number, required: true },
    invitedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

waitlistSchema.index({ event: 1, status: 1, position: 1 });
waitlistSchema.index({ user: 1, event: 1 }, { unique: true });

export const Waitlist = mongoose.model<IWaitlist>('Waitlist', waitlistSchema);
