import { Schema, model, Types, type Document, type Model } from 'mongoose';

/**
 * A QR code bound to a table. `token` is the signed value encoded in the QR
 * image; `version` supports rotating/invalidating a table's QR.
 */
export interface IQRCode extends Document {
  table: Types.ObjectId;
  token: string;
  version: number;
  isActive: boolean;
  lastScannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const qrCodeSchema = new Schema<IQRCode>(
  {
    table: { type: Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
    lastScannedAt: { type: Date },
  },
  { timestamps: true },
);

export const QRCode: Model<IQRCode> = model<IQRCode>('QRCode', qrCodeSchema);
