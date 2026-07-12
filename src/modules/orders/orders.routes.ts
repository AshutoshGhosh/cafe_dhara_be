import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { orderController } from './orders.controller';

const router = Router();

// --- Customer (public) -------------------------------------------------------
// Place an order. Prices are computed server-side; session validated in service.
router.post('/', asyncHandler(orderController.place));

// --- Staff -------------------------------------------------------------------
// List orders with optional status + date-range filters.
router.get(
  '/',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER, Role.WAITER, Role.CASHIER, Role.KITCHEN, Role.STAFF),
  asyncHandler(orderController.list),
);

// Advance order status (state machine). KITCHEN limited to PREPARING/READY (enforced in service).
router.patch(
  '/:id/status',
  authenticate,
  authorize(Role.OWNER, Role.MANAGER, Role.WAITER, Role.CASHIER, Role.KITCHEN, Role.STAFF),
  asyncHandler(orderController.updateStatus),
);

// Mark an order paid.
router.patch(
  '/:id/pay',
  authenticate,
  authorize(Role.CASHIER, Role.OWNER, Role.MANAGER),
  asyncHandler(orderController.pay),
);

// --- Shared: single order ----------------------------------------------------
// Public route: staff (valid bearer token) see any order; customers must pass a
// ?sessionId= that matches the order's session. Kept LAST so it doesn't shadow
// the more specific staff routes above.
router.get('/:id', asyncHandler(orderController.getById));

export default router;
