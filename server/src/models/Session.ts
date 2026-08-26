import mongoose, { Document, Schema } from 'mongoose';

export enum SessionType {
  KEYNOTE = 'keynote',
  WORKSHOP = 'workshop',
  PANEL = 'panel',
  TALK = 'talk',
  NETWORKING = 'networking',
  BREAK = 'break',
  OTHER = 'other',
}

export interface ISession extends Document {
  event: mongoose.Types.ObjectId;
  title: string;
  description: string;
  speaker: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  venue: string;
  type: SessionType;
  track: string;
  capacity: number;
  materials: string[];
  recordingUrl: string;
  slidesUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: [true, 'Session title is required'], trim: true },
    description: { type: String, maxlength: 2000 },
    speaker: { type: Schema.Types.ObjectId, ref: 'User' },
    startTime: { type: Date, required: [true, 'Start time is required'] },
    endTime: { type: Date, required: [true, 'End time is required'] },
    venue: { type: String },
    type: { type: String, enum: Object.values(SessionType), default: SessionType.TALK },
    track: { type: String },
    capacity: { type: Number },
    materials: [{ type: String }],
    recordingUrl: { type: String },
    slidesUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sessionSchema.index({ event: 1, startTime: 1 });
sessionSchema.index({ speaker: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
