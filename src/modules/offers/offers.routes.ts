import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { offersController } from './offers.controller';

const router = Router();

// Public/session: validate a coupon against a subtotal.
router.post('/validate', asyncHandler(offersController.validate));

// Staff management (OWNER / MANAGER).
const staff = authorize(Role.OWNER, Role.MANAGER);

router.get('/', authenticate, staff, asyncHandler(offersController.list));
router.post('/', authenticate, staff, asyncHandler(offersController.create));
router.get('/:id', authenticate, staff, asyncHandler(offersController.get));
router.patch('/:id', authenticate, staff, asyncHandler(offersController.update));
router.delete('/:id', authenticate, staff, asyncHandler(offersController.remove));

export default router;
