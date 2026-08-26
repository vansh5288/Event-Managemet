import mongoose, { Document, Schema } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface ICoupon extends Document {
  code: string;
  event?: mongoose.Types.ObjectId;
  type: DiscountType;
  value: number;
  maxDiscount?: number;
  minPurchase?: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, 'Coupon code cannot exceed 50 characters'],
    },
    event: { type: Schema.Types.ObjectId, ref: 'Event' },
    type: {
      type: String,
      enum: Object.values(DiscountType),
      required: [true, 'Discount type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    maxDiscount: { type: Number },
    minPurchase: { type: Number, default: 0 },
    maxUses: { type: Number, default: 100, min: 1 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ event: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);

