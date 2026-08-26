import mongoose, { Document } from 'mongoose';
export declare enum ChatRoomType {
    DIRECT = "direct",
    EVENT = "event",
    GROUP = "group"
}
export interface IChatRoom extends Document {
    type: ChatRoomType;
    name?: string;
    event?: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    lastMessage?: {
        content: string;
        sender: mongoose.Types.ObjectId;
        timestamp: Date;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ChatRoom: mongoose.Model<IChatRoom, {}, {}, {}, mongoose.Document<unknown, {}, IChatRoom> & IChatRoom & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=ChatRoom.d.ts.map