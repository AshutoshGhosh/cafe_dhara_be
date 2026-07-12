import type { Role } from '../models/enums';

/**
 * Augments Express's Request with the authenticated user set by `authenticate`.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      role: Role;
    }
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
