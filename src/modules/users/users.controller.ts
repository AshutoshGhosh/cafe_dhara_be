import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { AppError } from '../../common/AppError';
import { usersService } from './users.service';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  listUsersSchema,
} from './users.validation';

function requireActor(req: Request): string {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required', 'NO_AUTH');
  }
  return req.user.id;
}

export const usersController = {
  // POST /api/users
  async create(req: Request, res: Response): Promise<Response> {
    const input = createUserSchema.parse(req.body);
    const user = await usersService.create(input);
    return sendOk(res, { user }, 201);
  },

  // GET /api/users
  async list(req: Request, res: Response): Promise<Response> {
    const filter = listUsersSchema.parse(req.query);
    const users = await usersService.list(filter);
    return sendOk(res, { users }, 200, { count: users.length });
  },

  // GET /api/users/:id
  async getById(req: Request, res: Response): Promise<Response> {
    const user = await usersService.getById(req.params.id);
    return sendOk(res, { user }, 200);
  },

  // PATCH /api/users/:id
  async update(req: Request, res: Response): Promise<Response> {
    const actorId = requireActor(req);
    const input = updateUserSchema.parse(req.body);
    const user = await usersService.update(req.params.id, input, actorId);
    return sendOk(res, { user }, 200);
  },

  // PATCH /api/users/:id/password
  async resetPassword(req: Request, res: Response): Promise<Response> {
    const { password } = resetPasswordSchema.parse(req.body);
    const user = await usersService.resetPassword(req.params.id, password);
    return sendOk(res, { user }, 200);
  },

  // DELETE /api/users/:id
  async remove(req: Request, res: Response): Promise<Response> {
    const actorId = requireActor(req);
    const user = await usersService.softDelete(req.params.id, actorId);
    return sendOk(res, { user }, 200);
  },
};
