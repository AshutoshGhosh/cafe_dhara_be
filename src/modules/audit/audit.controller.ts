import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { auditService } from './audit.service';
import { auditQuerySchema } from './audit.validation';

export const auditController = {
  // GET /api/audit
  async list(req: Request, res: Response): Promise<Response> {
    const { page, limit, ...filters } = auditQuerySchema.parse(req.query);
    const result = await auditService.list({ ...filters, page, limit });
    return sendOk(res, { items: result.items }, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    });
  },
};
