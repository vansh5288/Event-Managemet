import mongoose, { Document } from 'mongoose';
export interface IReview extends Document {
    event: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview> & IReview & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Review.d.ts.map