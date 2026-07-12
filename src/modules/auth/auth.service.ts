import { v4 as uuidv4 } from 'uuid';
import { User, RefreshToken } from '../../models';
import type { IUser } from '../../models';
import type { Role } from '../../models/enums';
import { AppError } from '../../common/AppError';
import { verifyPassword } from '../../utils/password';
import { hashToken } from '../../utils/token';
import { signAccessToken } from '../../utils/jwt';
import { fromNow } from '../../utils/duration';
import { env } from '../../config/env';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_FALLBACK_MS = 7 * 24 * 60 * 60 * 1000;

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: Role;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function toPublicUser(u: IUser): PublicUser {
  return {
    id: String(u._id),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
  };
}

/**
 * Issue a new access JWT + persist a rotated refresh token (hashed).
 * The raw refresh token is returned to the caller exactly once.
 */
async function issueTokens(userId: string, email: string, role: Role): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const accessToken = signAccessToken({ sub: userId, email, role });

  const refreshToken = uuidv4();
  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    user: userId,
    expiresAt: fromNow(env.REFRESH_TOKEN_TTL, REFRESH_FALLBACK_MS),
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).select(
      '+passwordHash',
    );

    // Generic message to avoid user enumeration.
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw AppError.forbidden('Account temporarily locked. Try again later.', 'ACCOUNT_LOCKED');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const failed = user.failedLoginAttempts + 1;
      user.failedLoginAttempts = failed;
      if (failed >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await user.save();
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account is inactive', 'INACTIVE_USER');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await issueTokens(user.id, user.email, user.role);
    return { user: toPublicUser(user), ...tokens };
  },

  /**
   * Rotate a refresh token: verify it, revoke it, and issue a fresh pair.
   * A revoked/expired/unknown token is rejected with 401.
   */
  async refresh(rawToken: string): Promise<AuthResult> {
    const stored = await RefreshToken.findOne({
      tokenHash: hashToken(rawToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!stored) {
      throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH');
    }

    // Rotation: single-use tokens.
    stored.revokedAt = new Date();
    await stored.save();

    const user = await User.findById(stored.user);
    if (!user || !user.isActive || user.deletedAt) {
      throw AppError.unauthorized('User account is inactive', 'INACTIVE_USER');
    }

    const tokens = await issueTokens(user.id, user.email, user.role);
    return { user: toPublicUser(user), ...tokens };
  },

  /**
   * Revoke a single refresh token (if provided) or all of the user's tokens.
   */
  async logout(userId: string, rawToken?: string): Promise<void> {
    if (rawToken) {
      await RefreshToken.updateMany(
        { tokenHash: hashToken(rawToken), user: userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    } else {
      await RefreshToken.updateMany(
        { user: userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }
  },

  async getMe(userId: string): Promise<PublicUser> {
    const user = await User.findById(userId);
    if (!user || user.deletedAt) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return toPublicUser(user);
  },
};
