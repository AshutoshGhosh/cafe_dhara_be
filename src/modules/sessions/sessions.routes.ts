import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { sessionsController } from './sessions.controller';

const router = Router();

// Public: a customer starts a session by presenting a scanned QR token.
router.post('/start', asyncHandler(sessionsController.start));

// Public: check a session's status (the id is the customer's bearer credential).
router.get('/:id', asyncHandler(sessionsController.getOne));

// Staff or the session's customer (whoever holds the id) closes the session.
router.post('/:id/close', asyncHandler(sessionsController.close));

export default router;
