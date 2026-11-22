import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { verifyAccessToken } from '../../utils/jwt';
import { orderService } from './orders.service';
import {
  placeOrderSchema,
  placeStaffOrderSchema,
  listOrdersSchema,
  updateStatusSchema,
  idParamSchema,
  sessionQuerySchema,
} from './orders.validation';

/** Best-effort staff detection for the public getById route (no throw). */
function isStaffRequest(req: Request): boolean {
  if (req.user) return true;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      verifyAccessToken(header.slice(7).trim());
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export const orderController = {
  // POST /api/orders  (public / customer)
  async place(req: Request, res: Response): Promise<Response> {
    const input = placeOrderSchema.parse(req.body);
    const order = await orderService.placeOrder(input);
    return sendOk(res, { order }, 201);
  },

  // POST /api/orders/staff  (staff counter POS / verbal self-ordering)
  async placeStaff(req: Request, res: Response): Promise<Response> {
    const input = placeStaffOrderSchema.parse(req.body);
    const order = await orderService.placeOrderByStaff(input, req.user!);
    return sendOk(res, { order }, 201);
  },

  // GET /api/orders  (staff)
  async list(req: Request, res: Response): Promise<Response> {
    const filters = listOrdersSchema.parse(req.query);
    const orders = await orderService.list(filters);
    return sendOk(res, { orders }, 200, { count: orders.length });
  },

  // GET /api/orders/:id  (staff OR customer scoped to their sessionId)
  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const { sessionId } = sessionQuerySchema.parse(req.query);
    const order = await orderService.getById(id, {
      isStaff: isStaffRequest(req),
      sessionId,
    });
    return sendOk(res, { order }, 200);
  },

  // PATCH /api/orders/:id/status  (staff; KITCHEN limited to PREPARING/READY)
  async updateStatus(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const { status, cancelReason } = updateStatusSchema.parse(req.body);
    // authenticate middleware guarantees req.user is present here.
    const order = await orderService.updateStatus(id, status, req.user!.role, cancelReason);
    return sendOk(res, { order }, 200);
  },

  // PATCH /api/orders/:id/pay  (CASHIER / OWNER / MANAGER)
  async pay(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const order = await orderService.markPaid(id);
    return sendOk(res, { order }, 200);
  },
};
