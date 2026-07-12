import type { Request, Response } from 'express';
import { sendOk } from '../../common/response';
import { AppError } from '../../common/AppError';
import { publicUrlForFile } from './uploads.service';

export const uploadsController = {
  // POST /api/uploads/image  (OWNER/MANAGER) — multipart field `image`
  async uploadImage(req: Request, res: Response): Promise<Response> {
    const file = req.file;
    if (!file) {
      throw AppError.badRequest('No image file provided (field "image")', 'NO_FILE');
    }
    return sendOk(res, { url: publicUrlForFile(file.filename) }, 201);
  },
};
