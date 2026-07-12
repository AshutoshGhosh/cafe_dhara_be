import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { qrService } from './qr.service';
import { tableIdParamSchema, verifyTokenSchema } from './qr.validation';

export const qrController = {
  // POST /api/qr/generate/:tableId
  async generate(req: Request, res: Response): Promise<Response> {
    const { tableId } = tableIdParamSchema.parse(req.params);
    const qr = await qrService.generate(tableId);
    return sendOk(res, { qr }, 201);
  },

  // GET /api/qr/:tableId
  async getByTable(req: Request, res: Response): Promise<Response> {
    const { tableId } = tableIdParamSchema.parse(req.params);
    const qr = await qrService.getByTable(tableId);
    return sendOk(res, { qr }, 200);
  },

  // POST /api/qr/verify  (public)
  async verify(req: Request, res: Response): Promise<Response> {
    const { token } = verifyTokenSchema.parse(req.body ?? {});
    const { table } = await qrService.verify(token);
    return sendOk(
      res,
      {
        valid: true,
        table: {
          id: String(table._id),
          number: table.number,
          name: table.name,
          capacity: table.capacity,
        },
      },
      200,
    );
  },
};
