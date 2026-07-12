import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimit';
import { authController } from './auth.controller';

const router = Router();

router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/refresh', authLimiter, asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
