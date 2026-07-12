import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { feedbackController } from './feedback.controller';

const router = Router();

// Customers submit feedback without authentication.
router.post('/', asyncHandler(feedbackController.create));

// Staff review feedback (OWNER / MANAGER).
router.get(
  '/',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(feedbackController.list),
);

export default router;
