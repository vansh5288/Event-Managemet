import mongoose, { Document } from 'mongoose';
export declare enum SessionType {
    KEYNOTE = "keynote",
    WORKSHOP = "workshop",
    PANEL = "panel",
    TALK = "talk",
    NETWORKING = "networking",
    BREAK = "break",
    OTHER = "other"
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
export declare const Session: mongoose.Model<ISession, {}, {}, {}, mongoose.Document<unknown, {}, ISession> & ISession & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Session.d.ts.map