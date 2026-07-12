import { Schema, model, Types, type Document, type Model } from 'mongoose';

/**
 * Persisted refresh tokens (rotation + revoke). We store only the SHA-256 hash
 * of the opaque token, never the raw value.
 */
export interface IRefreshToken extends Document {
  tokenHash: string;
  user: Types.ObjectId;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL cleanup: Mongo removes documents once expiresAt passes.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<IRefreshToken> = model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);
