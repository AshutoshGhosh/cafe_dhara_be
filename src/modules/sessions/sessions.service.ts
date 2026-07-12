import { Session } from '../../models';
import type { ISession } from '../../models';
import { AppError } from '../../common/AppError';
import { qrService } from '../qr/qr.service';
import type { StartSessionInput } from './sessions.validation';

/** Default customer session lifetime (~3 hours). */
const SESSION_TTL_MS = 3 * 60 * 60 * 1000;

export type SessionStatus = 'active' | 'expired' | 'closed';

export interface PublicSession {
  id: string;
  tableId: string;
  tableNumber: number;
  status: SessionStatus;
  expiresAt: Date;
  createdAt: Date;
}

function statusOf(session: ISession): SessionStatus {
  if (!session.isActive) return 'closed';
  if (session.expiresAt.getTime() <= Date.now()) return 'expired';
  return 'active';
}

function toPublicSession(session: ISession, tableNumber: number): PublicSession {
  return {
    id: String(session._id),
    tableId: String(session.table),
    tableNumber,
    status: statusOf(session),
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };
}

export const sessionsService = {
  /**
   * Start an anonymous customer session from a scanned QR token.
   * Verifies the token (HMAC + current/active) via the QR service, then creates
   * a Session bound to the table. The returned session id is what the customer
   * sends with subsequent orders.
   */
  async start(input: StartSessionInput): Promise<PublicSession> {
    const { table, qr } = await qrService.verify(input.token);

    // Record the scan (best-effort; failure must not block the session).
    qr.lastScannedAt = new Date();
    await qr.save().catch(() => undefined);

    // One active session per table: a new scan supersedes any existing session
    // for this table, so an old device/session can't keep ordering.
    await Session.updateMany(
      { table: table._id, isActive: true },
      { $set: { isActive: false } },
    );

    const session = await Session.create({
      table: table._id,
      deviceFingerprint: input.deviceFingerprint,
      isActive: true,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });

    return toPublicSession(session, table.number);
  },

  async getById(id: string): Promise<PublicSession> {
    const session = await Session.findById(id).populate<{ table: { number: number } }>(
      'table',
      'number',
    );
    if (!session) throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    const tableNumber = (session.table as unknown as { number?: number })?.number ?? 0;
    return toPublicSession(session as unknown as ISession, tableNumber);
  },

  /**
   * Close a session. Callable by staff or by the customer who holds the id.
   * Idempotent: closing an already-closed/expired session is a no-op success.
   */
  async close(id: string): Promise<PublicSession> {
    const session = await Session.findById(id).populate<{ table: { number: number } }>(
      'table',
      'number',
    );
    if (!session) throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');

    const tableNumber = (session.table as unknown as { number?: number })?.number ?? 0;

    if (session.isActive) {
      session.isActive = false;
      await session.save();
    }
    return toPublicSession(session as unknown as ISession, tableNumber);
  },
};
