import { Schema, model, Types, type Document, type Model } from 'mongoose';
import { OfferType, OFFER_TYPE_VALUES, OfferScope, OFFER_SCOPE_VALUES } from './enums';

/**
 * A discount/offer. Scope determines what it applies to (whole cart, a category,
 * or a single item); category/menuItem are set when scoped narrower than CART.
 */
export interface IOffer extends Document {
  name: string;
  description?: string;
  type: OfferType;
  scope: OfferScope;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  couponCode?: string;
  category?: Types.ObjectId;
  menuItem?: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: OFFER_TYPE_VALUES, required: true },
    scope: { type: String, enum: OFFER_SCOPE_VALUES, default: OfferScope.CART },
    value: { type: Number, required: true },
    minOrderValue: { type: Number },
    maxDiscount: { type: Number },
    couponCode: { type: String, trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export const Offer: Model<IOffer> = model<IOffer>('Offer', offerSchema);
