import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/AppError';

/**
 * Signed table QR token.
 *
 * Format: `<tableId>.<nonce>.<hmac>` where
 *   hmac = HMAC-SHA256( `<tableId>.<nonce>` , key = QR_SECRET ).
 *
 * The token embeds the table id + a random nonce so it can be verified
 * (constant-time HMAC comparison) without a DB round-trip, while the nonce
 * makes each rotation unguessable and unique.
 */

function computeHmac(tableId: string, nonce: string): string {
  return crypto
    .createHmac('sha256', env.QR_SECRET)
    .update(`${tableId}.${nonce}`)
    .digest('hex');
}

/** Build a fresh signed token for a table. */
export function buildToken(tableId: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const sig = computeHmac(tableId, nonce);
  return `${tableId}.${nonce}.${sig}`;
}

/**
 * Verify a token's HMAC signature in constant time and return the embedded
 * table id. Throws 401 on any malformed/invalid token. This is a pure
 * cryptographic check — it does NOT confirm the token is the table's *current*
 * (non-rotated) QR; callers must additionally look it up in the QRCode model.
 */
export function verifyTokenSignature(token: string): string {
  if (typeof token !== 'string') {
    throw AppError.unauthorized('Invalid QR token', 'INVALID_QR_TOKEN');
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw AppError.unauthorized('Invalid QR token', 'INVALID_QR_TOKEN');
  }
  const [tableId, nonce, sig] = parts;
  if (!tableId || !nonce || !sig) {
    throw AppError.unauthorized('Invalid QR token', 'INVALID_QR_TOKEN');
  }

  const expected = computeHmac(tableId, nonce);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw AppError.unauthorized('Invalid QR token', 'INVALID_QR_TOKEN');
  }
  return tableId;
}
