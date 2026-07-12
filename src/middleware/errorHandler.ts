import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../common/AppError';
import { fail } from '../common/response';
import { env } from '../config/env';

/**
 * Global error handler. Converts any thrown error into the standard
 * { success:false, data:null, error } envelope. Stack traces and internal
 * details are NEVER sent to the client.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known, safe-to-expose operational errors.
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(fail({ code: err.code, message: err.message, details: err.details }));
    return;
  }

  // Zod validation errors -> 400 with field issues (safe to expose).
  if (err instanceof ZodError) {
    res.status(400).json(
      fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      }),
    );
    return;
  }

  // Mongoose validation / cast errors -> 400.
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json(
      fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
      }),
    );
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json(fail({ code: 'INVALID_ID', message: 'Invalid identifier' }));
    return;
  }

  // Duplicate key.
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json(fail({ code: 'DUPLICATE', message: 'Resource already exists' }));
    return;
  }

  // Unknown error -> generic 500. Log server-side only; never leak details.
  // eslint-disable-next-line no-console
  console.error('[error]', err instanceof Error ? err.stack : err);
  res.status(500).json(
    fail({
      code: 'INTERNAL',
      message: env.isProd ? 'Internal server error' : String((err as Error)?.message ?? err),
    }),
  );
}
