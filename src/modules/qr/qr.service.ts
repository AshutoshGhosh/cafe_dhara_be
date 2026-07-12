import QRCodeLib from 'qrcode';
import { Table, QRCode } from '../../models';
import type { ITable, IQRCode } from '../../models';
import { AppError } from '../../common/AppError';
import { buildToken, verifyTokenSignature } from './qr.token';

export interface PublicQRCode {
  id: string;
  tableId: string;
  tableNumber: number;
  token: string;
  version: number;
  isActive: boolean;
  scanUrl: string;
  imageDataUrl: string;
  lastScannedAt?: Date;
}

export interface VerifiedToken {
  table: ITable;
  qr: IQRCode;
}

/**
 * Build the URL a customer's phone opens after scanning. If CLIENT_URL is set
 * in the environment we produce an absolute URL; otherwise we fall back to a
 * relative path (the frontend can resolve it against its own origin).
 */
function buildScanUrl(token: string): string {
  const path = `/scan?t=${encodeURIComponent(token)}`;
  const base = process.env.CLIENT_URL?.trim();
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}${path}`;
}

async function renderImage(scanUrl: string): Promise<string> {
  return QRCodeLib.toDataURL(scanUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  });
}

async function toPublicQRCode(qr: IQRCode, table: ITable): Promise<PublicQRCode> {
  const scanUrl = buildScanUrl(qr.token);
  const imageDataUrl = await renderImage(scanUrl);
  return {
    id: String(qr._id),
    tableId: String(table._id),
    tableNumber: table.number,
    token: qr.token,
    version: qr.version,
    isActive: qr.isActive,
    scanUrl,
    imageDataUrl,
    lastScannedAt: qr.lastScannedAt,
  };
}

export const qrService = {
  /**
   * Create or rotate the QR token for a table and return a rendered PNG data URL.
   * Rotation overwrites the single QRCode doc for the table, so any previously
   * issued token is immediately invalidated.
   */
  async generate(tableId: string): Promise<PublicQRCode> {
    const table = await Table.findOne({ _id: tableId, deletedAt: null });
    if (!table) throw AppError.notFound('Table not found', 'TABLE_NOT_FOUND');

    const token = buildToken(String(table._id));

    let qr = await QRCode.findOne({ table: table._id });
    if (qr) {
      qr.token = token;
      qr.version += 1;
      qr.isActive = true;
      await qr.save();
    } else {
      qr = await QRCode.create({ table: table._id, token, version: 1, isActive: true });
    }

    return toPublicQRCode(qr, table);
  },

  /** Fetch the current active QR for a table (rendered). */
  async getByTable(tableId: string): Promise<PublicQRCode> {
    const table = await Table.findOne({ _id: tableId, deletedAt: null });
    if (!table) throw AppError.notFound('Table not found', 'TABLE_NOT_FOUND');

    const qr = await QRCode.findOne({ table: table._id, isActive: true });
    if (!qr) throw AppError.notFound('No active QR code for this table', 'QR_NOT_FOUND');

    return toPublicQRCode(qr, table);
  },

  /**
   * Verify a scanned token: constant-time HMAC check, then confirm it is the
   * table's current (non-rotated) active token and the table is live.
   * Shared by the public /qr/verify endpoint and session creation.
   */
  async verify(token: string): Promise<VerifiedToken> {
    const tableId = verifyTokenSignature(token);

    const qr = await QRCode.findOne({ token, isActive: true });
    if (!qr || String(qr.table) !== tableId) {
      throw AppError.unauthorized('QR token is invalid or has been rotated', 'INVALID_QR_TOKEN');
    }

    const table = await Table.findOne({ _id: tableId, deletedAt: null, isActive: true });
    if (!table) {
      throw AppError.notFound('Table is not available', 'TABLE_UNAVAILABLE');
    }

    return { table, qr };
  },
};
