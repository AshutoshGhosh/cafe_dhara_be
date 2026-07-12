import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { categoriesController } from './categories.controller';

const router = Router();

// Public reads.
router.get('/', asyncHandler(categoriesController.list));

// Writes (OWNER/MANAGER). `reorder` is declared before `/:id` to avoid capture.
router.post(
  '/reorder',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(categoriesController.reorder),
);
router.post(
  '/',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(categoriesController.create),
);
router.patch(
  '/:id',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(categoriesController.update),
);
router.delete(
  '/:id',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(categoriesController.remove),
);

// Public read by id (kept last so it doesn't shadow `/reorder`).
router.get('/:id', asyncHandler(categoriesController.getById));

export default router;
