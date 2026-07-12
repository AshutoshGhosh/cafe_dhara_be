import { Schema, model, Types, type Document, type Model } from 'mongoose';
import { OrderStatus, ORDER_STATUS_VALUES } from './enums';

/**
 * Order with EMBEDDED items. In Prisma, OrderItem and OrderItemAddOn were
 * separate tables; here they are subdocuments of the Order. We snapshot the
 * name/price at order time (denormalized) so historical orders stay accurate
 * even if the menu later changes. `menuItem`/`variant`/`addOn` keep the source
 * ids for reference.
 */
export interface IOrderItemAddOn {
  _id: Types.ObjectId;
  addOn?: Types.ObjectId;
  name: string;
  price: number;
}

export interface IOrderItem {
  _id: Types.ObjectId;
  menuItem?: Types.ObjectId;
  variant?: Types.ObjectId;
  name: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  addOns: Types.DocumentArray<IOrderItemAddOn>;
}

export interface IOrder extends Document {
  table: Types.ObjectId;
  session?: Types.ObjectId;
  orderNumber: number;
  status: OrderStatus;
  items: Types.DocumentArray<IOrderItem>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  offer?: Types.ObjectId;
  placedAt: Date;
  acceptedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemAddOnSchema = new Schema<IOrderItemAddOn>(
  {
    addOn: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: true },
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    variant: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    variantName: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    notes: { type: String },
    addOns: { type: [orderItemAddOnSchema], default: [] },
  },
  { _id: true },
);

const orderSchema = new Schema<IOrder>(
  {
    table: { type: Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', index: true },
    orderNumber: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: OrderStatus.PLACED,
      index: true,
    },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String },
    offer: { type: Schema.Types.ObjectId, ref: 'Offer' },
    placedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    servedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    isPaid: { type: Boolean, default: false, index: true },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

// Frequently-queried access patterns.
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = model<IOrder>('Order', orderSchema);
