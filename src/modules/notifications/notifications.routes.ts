import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { notificationsController } from './notifications.controller';

const router = Router();

// All notification routes require an authenticated staff/owner user.
router.use(authenticate);

router.get('/', asyncHandler(notificationsController.list));
router.patch('/read-all', asyncHandler(notificationsController.markAllRead));
router.patch('/:id/read', asyncHandler(notificationsController.markRead));

export default router;
