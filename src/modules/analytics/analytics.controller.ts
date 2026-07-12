import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { analyticsService } from './analytics.service';
import { dateRangeSchema, topItemsSchema } from './analytics.validation';

export const analyticsController = {
  // GET /api/analytics/summary
  async summary(req: Request, res: Response): Promise<Response> {
    const range = dateRangeSchema.parse(req.query);
    return sendOk(res, await analyticsService.summary(range));
  },

  // GET /api/analytics/revenue-by-day
  async revenueByDay(req: Request, res: Response): Promise<Response> {
    const range = dateRangeSchema.parse(req.query);
    return sendOk(res, { series: await analyticsService.revenueByDay(range) });
  },

  // GET /api/analytics/top-items
  async topItems(req: Request, res: Response): Promise<Response> {
    const { limit, ...range } = topItemsSchema.parse(req.query);
    return sendOk(res, { items: await analyticsService.topItems(range, limit) });
  },

  // GET /api/analytics/orders-by-status
  async ordersByStatus(req: Request, res: Response): Promise<Response> {
    const range = dateRangeSchema.parse(req.query);
    return sendOk(res, { statuses: await analyticsService.ordersByStatus(range) });
  },

  // GET /api/analytics/peak-hours
  async peakHours(req: Request, res: Response): Promise<Response> {
    const range = dateRangeSchema.parse(req.query);
    return sendOk(res, { hours: await analyticsService.peakHours(range) });
  },
};
