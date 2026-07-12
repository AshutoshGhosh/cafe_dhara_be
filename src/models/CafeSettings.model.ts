import { Schema, model, type Document, type Model } from 'mongoose';

/**
 * Singleton cafe configuration (one document). Holds the details printed on
 * bills — cafe/legal name, address, GSTIN, GST rate — plus the invoice number
 * sequence. Read by staff; edited by the OWNER via the Settings page.
 */
export interface ICafeSettings extends Document {
  cafeName: string;
  legalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstEnabled: boolean;
  gstin?: string;
  gstRate: number;
  invoicePrefix: string;
  invoiceCounter: number;
  billFooterNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cafeSettingsSchema = new Schema<ICafeSettings>(
  {
    cafeName: { type: String, required: true, default: 'Cafe Dhara' },
    legalName: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    phone: { type: String },
    email: { type: String },
    gstEnabled: { type: Boolean, default: false },
    gstin: { type: String },
    gstRate: { type: Number, default: 5, min: 0, max: 28 },
    invoicePrefix: { type: String, default: 'INV-' },
    invoiceCounter: { type: Number, default: 0 },
    billFooterNote: { type: String },
  },
  { timestamps: true },
);

export const CafeSettings: Model<ICafeSettings> = model<ICafeSettings>(
  'CafeSettings',
  cafeSettingsSchema,
);
