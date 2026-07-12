import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { feedbackService } from './feedback.service';
import { createFeedbackSchema, listFeedbackSchema } from './feedback.validation';

export const feedbackController = {
  // POST /api/feedback  (public/customer)
  async create(req: Request, res: Response): Promise<Response> {
    const input = createFeedbackSchema.parse(req.body);
    const feedback = await feedbackService.create(input);
    return sendOk(res, { feedback }, 201);
  },

  // GET /api/feedback  (staff)
  async list(req: Request, res: Response): Promise<Response> {
    const filter = listFeedbackSchema.parse(req.query);
    const feedback = await feedbackService.list(filter);
    return sendOk(res, { feedback }, 200);
  },
};
