import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireOwner } from '../../middleware/authorize';
import { auditController } from './audit.controller';

const router = Router();

// Audit trail is OWNER-only.
router.get('/', authenticate, requireOwner, asyncHandler(auditController.list));

export default router;
