import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { analyticsController } from './analytics.controller';

const router = Router();

// All analytics is restricted to OWNER + MANAGER.
router.use(authenticate, authorize(Role.OWNER, Role.MANAGER));

router.get('/summary', asyncHandler(analyticsController.summary));
router.get('/revenue-by-day', asyncHandler(analyticsController.revenueByDay));
router.get('/top-items', asyncHandler(analyticsController.topItems));
router.get('/orders-by-status', asyncHandler(analyticsController.ordersByStatus));
router.get('/peak-hours', asyncHandler(analyticsController.peakHours));

export default router;
