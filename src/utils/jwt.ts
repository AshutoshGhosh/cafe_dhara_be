import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../common/AppError';

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: string;
  type: 'access';
}

/** Sign a short-lived access JWT. */
export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, options);
}

/** Verify an access JWT and return its payload, or throw a 401 AppError. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw AppError.unauthorized('Invalid token type', 'INVALID_TOKEN');
    }
    return decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Invalid or expired token', 'INVALID_TOKEN');
  }
}
