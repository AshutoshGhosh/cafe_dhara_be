import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { menuService } from './menu.service';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  availabilitySchema,
  listItemsQuerySchema,
  objectIdSchema,
} from './menu.validation';

export const menuController = {
  // GET /api/menu  (public: categories with nested available items)
  async publicMenu(_req: Request, res: Response): Promise<Response> {
    const categories = await menuService.publicMenu();
    return sendOk(res, { categories });
  },

  // GET /api/menu/items/:id  (public)
  async publicItem(req: Request, res: Response): Promise<Response> {
    const id = objectIdSchema.parse(req.params.id);
    const item = await menuService.publicItem(id);
    return sendOk(res, { item });
  },

  // GET /api/menu/items  (OWNER/MANAGER: full list incl. unavailable)
  async listItems(req: Request, res: Response): Promise<Response> {
    const query = listItemsQuerySchema.parse(req.query);
    const items = await menuService.listItems(query);
    return sendOk(res, { items });
  },

  // POST /api/menu/items  (OWNER/MANAGER)
  async create(req: Request, res: Response): Promise<Response> {
    const input = createMenuItemSchema.parse(req.body);
    const item = await menuService.create(input);
    return sendOk(res, { item }, 201);
  },

  // PATCH /api/menu/items/:id  (OWNER/MANAGER)
  async update(req: Request, res: Response): Promise<Response> {
    const id = objectIdSchema.parse(req.params.id);
    const input = updateMenuItemSchema.parse(req.body);
    const item = await menuService.update(id, input);
    return sendOk(res, { item });
  },

  // PATCH /api/menu/items/:id/availability  (OWNER/MANAGER)
  async setAvailability(req: Request, res: Response): Promise<Response> {
    const id = objectIdSchema.parse(req.params.id);
    const { isAvailable } = availabilitySchema.parse(req.body);
    const item = await menuService.setAvailability(id, isAvailable);
    return sendOk(res, { item });
  },

  // DELETE /api/menu/items/:id  (OWNER/MANAGER, soft-delete)
  async remove(req: Request, res: Response): Promise<Response> {
    const id = objectIdSchema.parse(req.params.id);
    await menuService.remove(id);
    return sendOk(res, { deleted: true });
  },
};
