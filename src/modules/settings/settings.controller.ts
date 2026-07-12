import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { settingsService } from './settings.service';
import { updateSettingsSchema } from './settings.validation';

export const settingsController = {
  // GET /api/settings  (any authenticated staff)
  async get(_req: Request, res: Response): Promise<Response> {
    const settings = await settingsService.get();
    return sendOk(res, { settings });
  },

  // PATCH /api/settings  (OWNER)
  async update(req: Request, res: Response): Promise<Response> {
    const input = updateSettingsSchema.parse(req.body);
    const settings = await settingsService.update(input);
    return sendOk(res, { settings });
  },
};
