import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/AppError';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models';
import type { Role } from '../models/enums';

/**
 * Extracts a Bearer access token (Authorization header or `accessToken` cookie),
 * verifies it, confirms the user still exists and is active, and attaches
 * `req.user`. Throws 401 on any failure.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    let token: string | undefined;

    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    } else if (typeof req.cookies?.accessToken === 'string') {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw AppError.unauthorized('Authentication required', 'NO_TOKEN');
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select('_id email role isActive');
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User no longer active', 'INACTIVE_USER');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
