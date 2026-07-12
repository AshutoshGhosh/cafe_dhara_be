import rateLimit from 'express-rate-limit';
import { fail } from '../common/response';

/** General API limiter — applied to the whole /api router. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(fail({ code: 'RATE_LIMITED', message: 'Too many requests' }));
  },
});

/** Tighter limiter for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(fail({ code: 'RATE_LIMITED', message: 'Too many attempts, try later' }));
  },
});
