import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { qrController } from './qr.controller';

const router = Router();

// Public: a scanning customer verifies a token before starting a session.
router.post('/verify', asyncHandler(qrController.verify));

// Staff: create / rotate a table's QR (returns a PNG data URL).
router.post(
  '/generate/:tableId',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER),
  asyncHandler(qrController.generate),
);

// Staff: fetch the current QR for a table.
router.get('/:tableId', authenticate, asyncHandler(qrController.getByTable));

export default router;
