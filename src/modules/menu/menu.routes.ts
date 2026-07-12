import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { menuController } from './menu.controller';

const router = Router();

const staffWrite = [authenticate, authorize(Role.OWNER, Role.MANAGER)] as const;

// --- Public customer reads ---------------------------------------------------
router.get('/', asyncHandler(menuController.publicMenu));

// --- Admin item management (declared before the public `/items/:id` read) ----
router.get('/items', ...staffWrite, asyncHandler(menuController.listItems));
router.post('/items', ...staffWrite, asyncHandler(menuController.create));
router.patch('/items/:id/availability', ...staffWrite, asyncHandler(menuController.setAvailability));
router.patch('/items/:id', ...staffWrite, asyncHandler(menuController.update));
router.delete('/items/:id', ...staffWrite, asyncHandler(menuController.remove));

// --- Public single item (kept last so it doesn't shadow admin item routes) ---
router.get('/items/:id', asyncHandler(menuController.publicItem));

export default router;
