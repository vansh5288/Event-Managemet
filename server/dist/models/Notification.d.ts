import mongoose, { Document } from 'mongoose';
export declare enum NotificationType {
    REGISTRATION = "registration",
    PAYMENT = "payment",
    REMINDER = "reminder",
    CERTIFICATE = "certificate",
    EVENT_UPDATE = "event_update",
    CHAT_MESSAGE = "chat_message",
    SYSTEM = "system",
    PROMOTION = "promotion"
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
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification> & INotification & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Notification.d.ts.map