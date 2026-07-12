import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { billsService } from './bills.service';
import { generateBillSchema, listBillsSchema } from './bills.validation';

export const billsController = {
  // POST /api/bills  (CASHIER / MANAGER / OWNER) — generate a final bill
  async generate(req: Request, res: Response): Promise<Response> {
    const input = generateBillSchema.parse(req.body);
    const invoice = await billsService.generate(input, req.user?.id);
    return sendOk(res, { invoice }, 201);
  },

  // GET /api/bills/:id  (any authenticated staff) — fetch a bill to print
  async get(req: Request, res: Response): Promise<Response> {
    const invoice = await billsService.getById(req.params.id);
    return sendOk(res, { invoice });
  },

  // GET /api/bills  (OWNER / MANAGER) — list bills
  async list(req: Request, res: Response): Promise<Response> {
    const filter = listBillsSchema.parse(req.query);
    const invoices = await billsService.list(filter);
    return sendOk(res, { invoices });
  },
};
