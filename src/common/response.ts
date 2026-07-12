import type { Response } from 'express';

/**
 * Canonical API envelope: { success, data, error, meta }.
 * Mirrors the reference NestJS backend's response contract.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: Record<string, unknown>;
}

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T> {
  return { success: true, data, error: null, ...(meta ? { meta } : {}) };
}

export function fail(error: ApiError, meta?: Record<string, unknown>): ApiEnvelope<null> {
  return { success: false, data: null, error, ...(meta ? { meta } : {}) };
}

/** Send a success envelope with an explicit status code (default 200). */
export function sendOk<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): Response {
  return res.status(status).json(ok(data, meta));
}
