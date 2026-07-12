import { Router } from 'express';
import authRoutes from './auth/auth.routes';

/**
 * ============================================================================
 * CENTRAL API ROUTER  —  READ THIS BEFORE ADDING A FEATURE MODULE
 * ============================================================================
 * Every feature module plugs into the app through this file. To add one:
 *
 *   1. Create src/modules/<name>/<name>.routes.ts that does:
 *          import { Router } from 'express';
 *          const router = Router();
 *          // ...define routes...
 *          export default router;   // <-- MUST be a default-exported Router
 *
 *   2. Add ONE import line in the "feature imports" block below.
 *   3. Add ONE `apiRouter.use('/<name>', <name>Routes)` line in the block
 *      marked "register feature routers here".
 *
 * Keep additions to a single line each so parallel edits rarely collide.
 * A module's own logic lives entirely inside its folder
 * (<name>.routes.ts / .controller.ts / .service.ts / .validation.ts).
 * ============================================================================
 */

const apiRouter = Router();

// --- feature imports (add new module imports above this line) ----------------
import usersRoutes from './users/users.routes';
import categoriesRoutes from './categories/categories.routes';
import menuRoutes from './menu/menu.routes';
import uploadsRoutes from './uploads/uploads.routes';
import tablesRoutes from './tables/tables.routes';
import qrRoutes from './qr/qr.routes';
import sessionsRoutes from './sessions/sessions.routes';
import ordersRoutes from './orders/orders.routes';
import offersRoutes from './offers/offers.routes';
import feedbackRoutes from './feedback/feedback.routes';
import notificationsRoutes from './notifications/notifications.routes';
import analyticsRoutes from './analytics/analytics.routes';
import auditRoutes from './audit/audit.routes';
import settingsRoutes from './settings/settings.routes';
import billsRoutes from './bills/bills.routes';

// --- register feature routers here -------------------------------------------
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/menu', menuRoutes);
apiRouter.use('/uploads', uploadsRoutes);
apiRouter.use('/tables', tablesRoutes);
apiRouter.use('/qr', qrRoutes);
apiRouter.use('/sessions', sessionsRoutes);
apiRouter.use('/orders', ordersRoutes);
apiRouter.use('/offers', offersRoutes);
apiRouter.use('/feedback', feedbackRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/bills', billsRoutes);
// -----------------------------------------------------------------------------

export default apiRouter;
