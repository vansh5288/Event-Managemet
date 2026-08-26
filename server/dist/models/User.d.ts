import mongoose, { Document } from 'mongoose';
export declare enum UserRole {
    ADMIN = "admin",
    ORGANIZER = "organizer",
    VOLUNTEER = "volunteer",
    PARTICIPANT = "participant",
    SPONSOR = "sponsor",
    JUDGE = "judge",
    SPEAKER = "speaker"
}
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
    bio?: string;
    phone?: string;
    organization?: string;
    isVerified: boolean;
    isActive: boolean;
    lastLogin?: Date;
    otp?: string;
    otpExpiry?: Date;
    refreshToken?: string;
    socialLinks?: {
        website?: string;
        github?: string;
        linkedin?: string;
        twitter?: string;
    };
    preferences?: {
        notifications: boolean;
        emailUpdates: boolean;
        darkMode: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=User.d.ts.map