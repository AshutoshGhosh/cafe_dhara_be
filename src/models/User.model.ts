import { Schema, model, type Document, type Model } from 'mongoose';
import { Role, ROLE_VALUES } from './enums';

/**
 * User = a cafe staff member. OWNER is the single admin (there is no separate
 * platform/super-admin role in the single-cafe model). Customers do NOT have
 * User accounts — they interact via anonymous Sessions from QR scans.
 *
 * `firstName`/`lastName` come straight from the Prisma User model.
 */
export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: Role;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    role: { type: String, enum: ROLE_VALUES, default: Role.STAFF, index: true },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

// Never leak the password hash even if it was explicitly selected.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    delete r.passwordHash;
    delete r.__v;
    return r;
  },
});

export const User: Model<IUser> = model<IUser>('User', userSchema);
