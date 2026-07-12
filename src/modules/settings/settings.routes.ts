import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { settingsController } from './settings.controller';

const router = Router();

// Any authenticated staff can read settings (needed for bills / dashboard).
router.get('/', authenticate, asyncHandler(settingsController.get));

// Only the OWNER edits cafe / GST / invoice configuration.
router.patch('/', authenticate, authorize(Role.OWNER), asyncHandler(settingsController.update));

export default router;
