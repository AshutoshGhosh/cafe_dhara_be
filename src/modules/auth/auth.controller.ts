import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { AppError } from '../../common/AppError';
import { authService } from './auth.service';
import { loginSchema, refreshSchema } from './auth.validation';
import { env } from '../../config/env';
import { durationToMs } from '../../utils/duration';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_FALLBACK_MS = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: durationToMs(env.REFRESH_TOKEN_TTL, REFRESH_FALLBACK_MS),
    path: '/api/auth',
  });
}

export const authController = {
  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    setRefreshCookie(res, result.refreshToken);
    return sendOk(res, result, 200);
  },

  // POST /api/auth/refresh
  async refresh(req: Request, res: Response): Promise<Response> {
    const body = refreshSchema.parse(req.body ?? {});
    const token = body.refreshToken ?? (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    if (!token) {
      throw AppError.unauthorized('Refresh token required', 'NO_REFRESH');
    }
    const result = await authService.refresh(token);
    setRefreshCookie(res, result.refreshToken);
    return sendOk(res, result, 200);
  },

  // POST /api/auth/logout
  async logout(req: Request, res: Response): Promise<Response> {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? req.body?.refreshToken;
    if (req.user) {
      await authService.logout(req.user.id, token);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return sendOk(res, { loggedOut: true }, 200);
  },

  // GET /api/auth/me
  async me(req: Request, res: Response): Promise<Response> {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required', 'NO_AUTH');
    }
    const user = await authService.getMe(req.user.id);
    return sendOk(res, { user }, 200);
  },
};
