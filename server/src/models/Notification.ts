import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  REGISTRATION = 'registration',
  PAYMENT = 'payment',
  REMINDER = 'reminder',
  CERTIFICATE = 'certificate',
  EVENT_UPDATE = 'event_update',
  CHAT_MESSAGE = 'chat_message',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
}

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.SYSTEM,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
