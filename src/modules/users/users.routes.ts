import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireOwner } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { usersController } from './users.controller';

const router = Router();

// All staff-management routes require authentication.
router.use(authenticate);

// Owner-only: create staff.
router.post('/', requireOwner, asyncHandler(usersController.create));

// Owner + Manager: read staff.
router.get('/', authorize(Role.OWNER, Role.MANAGER), asyncHandler(usersController.list));
router.get('/:id', authorize(Role.OWNER, Role.MANAGER), asyncHandler(usersController.getById));

// Owner-only: mutate staff.
router.patch('/:id', requireOwner, asyncHandler(usersController.update));
router.patch('/:id/password', requireOwner, asyncHandler(usersController.resetPassword));
router.delete('/:id', requireOwner, asyncHandler(usersController.remove));

export default router;
