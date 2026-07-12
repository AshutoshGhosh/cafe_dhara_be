import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/AppError';
import { Role } from '../models/enums';

/**
 * RBAC guard. Use AFTER `authenticate`. Passes only if the authenticated user's
 * role is in the allowed list.
 *
 *   router.post('/', authenticate, authorize(Role.OWNER, Role.MANAGER), handler)
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required', 'NO_AUTH'));
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
}

/** Convenience guard for owner-only routes (staff management, etc.). */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  return authorize(Role.OWNER)(req, res, next);
}
