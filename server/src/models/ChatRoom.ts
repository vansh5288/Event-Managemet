import mongoose, { Document, Schema } from 'mongoose';

export enum ChatRoomType {
  DIRECT = 'direct',
  EVENT = 'event',
  GROUP = 'group',
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

const chatRoomSchema = new Schema<IChatRoom>(
  {
    type: {
      type: String,
      enum: Object.values(ChatRoomType),
      required: true,
    },
    name: { type: String },
    event: { type: Schema.Types.ObjectId, ref: 'Event' },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: {
      content: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ event: 1 });
chatRoomSchema.index({ type: 1, isActive: 1 });

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);
