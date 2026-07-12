import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { tablesService } from './tables.service';
import {
  createTableSchema,
  updateTableSchema,
  idParamSchema,
  listTablesQuerySchema,
} from './tables.validation';

export const tablesController = {
  // GET /api/tables
  async list(req: Request, res: Response): Promise<Response> {
    const { includeInactive } = listTablesQuerySchema.parse(req.query);
    const tables = await tablesService.list(includeInactive);
    return sendOk(res, { tables }, 200);
  },

  // GET /api/tables/:id
  async getOne(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const table = await tablesService.getById(id);
    return sendOk(res, { table }, 200);
  },

  // POST /api/tables
  async create(req: Request, res: Response): Promise<Response> {
    const input = createTableSchema.parse(req.body);
    const table = await tablesService.create(input);
    return sendOk(res, { table }, 201);
  },

  // PATCH /api/tables/:id
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const input = updateTableSchema.parse(req.body);
    const table = await tablesService.update(id, input);
    return sendOk(res, { table }, 200);
  },

  // DELETE /api/tables/:id
  async remove(req: Request, res: Response): Promise<Response> {
    const { id } = idParamSchema.parse(req.params);
    const result = await tablesService.remove(id);
    return sendOk(res, result, 200);
  },
};
