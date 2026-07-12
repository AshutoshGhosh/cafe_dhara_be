import crypto from 'crypto';

/**
 * Fast, deterministic hash used for refresh-token lookups.
 * (Password-grade hashing like bcrypt is too slow for indexed lookups, and we
 * only need to avoid storing the raw opaque token at rest.)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
