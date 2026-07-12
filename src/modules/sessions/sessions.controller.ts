import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { sessionsService } from './sessions.service';
import { startSessionSchema, idParamSchema } from './sessions.validation';

export const sessionsController = {
  // POST /api/sessions/start  (public)
  async start(req: Request, res: Response): Promise<Response> {
    const input = startSessionSchema.parse(req.body ?? {});
    const session = await sessionsService.start(input);
    return sendOk(res, { session }, 201);
  },

  // GET /api/sessions/:id
  async getOne(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const session = await sessionsService.getById(id);
    return sendOk(res, { session }, 200);
  },

  // POST /api/sessions/:id/close  (staff or the session's customer)
  async close(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const session = await sessionsService.close(id);
    return sendOk(res, { session }, 200);
  },
};
