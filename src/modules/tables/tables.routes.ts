import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { tablesController } from './tables.controller';

const router = Router();

// Reads: any authenticated staff member.
router.get('/', authenticate, asyncHandler(tablesController.list));
router.get('/:id', authenticate, asyncHandler(tablesController.getOne));

// Mutations: OWNER / MANAGER only.
router.post(
  '/',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(tablesController.create),
);
router.patch(
  '/:id',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(tablesController.update),
);
router.delete(
  '/:id',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(tablesController.remove),
);

export default router;
