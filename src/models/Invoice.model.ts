import { Schema, model, Types, type Document, type Model } from 'mongoose';
import { PaymentMode, PAYMENT_MODE_VALUES } from './enums';

/**
 * A final bill for a table. Aggregates one or more orders, snapshots the line
 * items + cafe/GST details at issue time, and carries a sequential, unique
 * invoice number. This is a customer-facing tax invoice — unrelated to the
 * (dropped) multi-tenant subscription "Invoice" from the reference schema.
 */
export interface IInvoiceItem {
  name: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IInvoiceCafeSnapshot {
  name: string;
  legalName?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  email?: string;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  session?: Types.ObjectId;
  table: number;
  orders: Types.ObjectId[];
  items: IInvoiceItem[];
  subtotal: number;
  gstEnabled: boolean;
  gstRate: number;
  cgst: number;
  sgst: number;
  taxAmount: number;
  total: number;
  cafe: IInvoiceCafeSnapshot;
  paymentMode: PaymentMode;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    name: { type: String, required: true },
    variantName: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const cafeSnapshotSchema = new Schema<IInvoiceCafeSnapshot>(
  {
    name: { type: String, required: true },
    legalName: { type: String },
    address: { type: String },
    gstin: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  { _id: false },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', index: true },
    table: { type: Number, required: true },
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    gstEnabled: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    cafe: { type: cafeSnapshotSchema, required: true },
    paymentMode: { type: String, enum: PAYMENT_MODE_VALUES, default: PaymentMode.CASH },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

invoiceSchema.index({ createdAt: -1 });

export const Invoice: Model<IInvoice> = model<IInvoice>('Invoice', invoiceSchema);
