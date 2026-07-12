import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { AppError } from '../../common/AppError';
import { notificationsService } from './notifications.service';
import { listNotificationsSchema, notificationIdSchema } from './notifications.validation';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required', 'NO_AUTH');
  }
  return req.user.id;
}

export const notificationsController = {
  // GET /api/notifications
  async list(req: Request, res: Response): Promise<Response> {
    const userId = requireUserId(req);
    const filter = listNotificationsSchema.parse(req.query);
    const notifications = await notificationsService.listForUser(userId, filter);
    return sendOk(res, { notifications }, 200);
  },

  // PATCH /api/notifications/:id/read
  async markRead(req: Request, res: Response): Promise<Response> {
    const userId = requireUserId(req);
    const { id } = notificationIdSchema.parse(req.params);
    const notification = await notificationsService.markRead(userId, id);
    return sendOk(res, { notification }, 200);
  },

  // PATCH /api/notifications/read-all
  async markAllRead(req: Request, res: Response): Promise<Response> {
    const userId = requireUserId(req);
    const result = await notificationsService.markAllRead(userId);
    return sendOk(res, result, 200);
  },
};
