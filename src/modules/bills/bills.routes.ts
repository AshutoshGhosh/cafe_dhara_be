import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { billsController } from './bills.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER, Role.CASHIER),
  asyncHandler(billsController.generate),
);

router.get('/', authenticate, authorize(Role.OWNER, Role.MANAGER), asyncHandler(billsController.list));

router.get('/:id', authenticate, asyncHandler(billsController.get));

export default router;
