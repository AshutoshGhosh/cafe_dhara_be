import { Schema, model, Types, type Document, type Model } from 'mongoose';

/**
 * A customer's table session, created when they scan a table QR code.
 * Anonymous — no User account. Expires automatically.
 */
export interface ISession extends Document {
  table: Types.ObjectId;
  deviceFingerprint?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    table: { type: Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    deviceFingerprint: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL cleanup of expired sessions.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> = model<ISession>('Session', sessionSchema);
