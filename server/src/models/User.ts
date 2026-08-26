import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  VOLUNTEER = 'volunteer',
  PARTICIPANT = 'participant',
  SPONSOR = 'sponsor',
  JUDGE = 'judge',
  SPEAKER = 'speaker',
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

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PARTICIPANT,
    },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    phone: { type: String },
    organization: { type: String },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    otp: { type: String },
    otpExpiry: { type: Date },
    refreshToken: { type: String },
    socialLinks: {
      website: { type: String },
      github: { type: String },
      linkedin: { type: String },
      twitter: { type: String },
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      emailUpdates: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (this: IUser, next: Function) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
} as any);

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ name: 'text', email: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);

