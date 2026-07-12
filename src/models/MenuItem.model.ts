import { Schema, model, Types, type Document, type Model } from 'mongoose';
import {
  VegType,
  VEG_TYPE_VALUES,
  SpiceLevel,
  SPICE_LEVEL_VALUES,
} from './enums';

/**
 * Variant and AddOn are EMBEDDED as subdocuments of MenuItem (they were separate
 * tables in Prisma but only ever belong to one menu item). Each keeps its own
 * `_id` so orders can reference a specific variant/add-on by id.
 */
export interface IVariant {
  _id: Types.ObjectId;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface IAddOn {
  _id: Types.ObjectId;
  name: string;
  price: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface IMenuItem extends Document {
  category: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image?: string;
  vegType: VegType;
  spiceLevel: SpiceLevel;
  prepTime?: number;
  isAvailable: boolean;
  isRecommended: boolean;
  isBestseller: boolean;
  sku?: string;
  sortOrder: number;
  variants: Types.DocumentArray<IVariant>;
  addOns: Types.DocumentArray<IAddOn>;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>(
  {
    name: { type: String, required: true, trim: true },
    priceAdjustment: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
);

const addOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
);

const menuItemSchema = new Schema<IMenuItem>(
  {
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    image: { type: String },
    vegType: { type: String, enum: VEG_TYPE_VALUES, default: VegType.VEG },
    spiceLevel: { type: String, enum: SPICE_LEVEL_VALUES, default: SpiceLevel.NONE },
    prepTime: { type: Number },
    isAvailable: { type: Boolean, default: true, index: true },
    isRecommended: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    sku: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    variants: { type: [variantSchema], default: [] },
    addOns: { type: [addOnSchema], default: [] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export const MenuItem: Model<IMenuItem> = model<IMenuItem>('MenuItem', menuItemSchema);
