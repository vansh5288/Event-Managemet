import mongoose, { Document } from 'mongoose';
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    FILE = "file",
    SYSTEM = "system"
}
export interface IMessage extends Document {
    chatRoom: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    content: string;
    type: MessageType;
    fileUrl?: string;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage> & IMessage & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Message.d.ts.map