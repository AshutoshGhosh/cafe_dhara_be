import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { categoriesService } from './categories.service';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderSchema,
  objectIdSchema,
} from './categories.validation';

export const categoriesController = {
  // GET /api/categories  (public: active only)
  async list(_req: Request, res: Response): Promise<Response> {
    const categories = await categoriesService.list();
    return sendOk(res, { categories });
  },

  // GET /api/categories/:id  (public)
  async getById(req: Request, res: Response): Promise<Response> {
    const id = objectIdSchema.parse(req.params.id);
    const category = await categoriesService.getById(id);
    return sendOk(res, { category });
  },

  // POST /api/categories  (OWNER/MANAGER)
  async create(req: Request, res: Response): Promise<Response> {
    const input = createCategorySchema.parse(req.body);
    const category = await categoriesService.create(input);
    return sendOk(res, { category }, 201);
  },

  // PATCH /api/categories/:id  (OWNER/MANAGER)
  async update(req: Request, res: Response): Promise<Response> {
    const id = objectIdSchema.parse(req.params.id);
    const input = updateCategorySchema.parse(req.body);
    const category = await categoriesService.update(id, input);
    return sendOk(res, { category });
  },

  // POST /api/categories/reorder  (OWNER/MANAGER)
  async reorder(req: Request, res: Response): Promise<Response> {
    const input = reorderSchema.parse(req.body);
    const categories = await categoriesService.reorder(input);
    return sendOk(res, { categories });
  },

  // DELETE /api/categories/:id  (OWNER/MANAGER, soft-delete)
  async remove(req: Request, res: Response): Promise<Response> {
    const id = objectIdSchema.parse(req.params.id);
    await categoriesService.remove(id);
    return sendOk(res, { deleted: true });
  },
};
