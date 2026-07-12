import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { offersService } from './offers.service';
import {
  createOfferSchema,
  updateOfferSchema,
  listOffersSchema,
  validateOfferSchema,
} from './offers.validation';

export const offersController = {
  // POST /api/offers
  async create(req: Request, res: Response): Promise<Response> {
    const input = createOfferSchema.parse(req.body);
    const offer = await offersService.create(input);
    return sendOk(res, { offer }, 201);
  },

  // GET /api/offers
  async list(req: Request, res: Response): Promise<Response> {
    const filter = listOffersSchema.parse(req.query);
    const offers = await offersService.list(filter);
    return sendOk(res, { offers }, 200);
  },

  // GET /api/offers/:id
  async get(req: Request, res: Response): Promise<Response> {
    const offer = await offersService.getById(req.params.id);
    return sendOk(res, { offer }, 200);
  },

  // PATCH /api/offers/:id
  async update(req: Request, res: Response): Promise<Response> {
    const input = updateOfferSchema.parse(req.body);
    const offer = await offersService.update(req.params.id, input);
    return sendOk(res, { offer }, 200);
  },

  // DELETE /api/offers/:id
  async remove(req: Request, res: Response): Promise<Response> {
    await offersService.remove(req.params.id);
    return sendOk(res, { deleted: true }, 200);
  },

  // POST /api/offers/validate
  async validate(req: Request, res: Response): Promise<Response> {
    const { code, subtotal } = validateOfferSchema.parse(req.body);
    const result = await offersService.validate(code, subtotal);
    return sendOk(res, result, 200);
  },
};
