import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../common/asyncHandler';
import { AppError } from '../../common/AppError';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { imageUpload } from './uploads.service';
import { uploadsController } from './uploads.controller';

const router = Router();

/**
 * Run multer, translating its errors (size limit, unexpected field) into safe
 * 400 AppErrors instead of leaking a generic 500 from the global handler.
 */
function handleImageUpload(req: Request, res: Response, next: NextFunction): void {
  imageUpload.single('image')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Image exceeds the maximum allowed size'
          : `Upload error: ${err.field ?? err.code}`;
      return next(AppError.badRequest(message, 'UPLOAD_ERROR'));
    }
    if (err) return next(err);
    return next();
  });
}

router.post(
  '/image',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  handleImageUpload,
  asyncHandler(uploadsController.uploadImage),
);

export default router;
