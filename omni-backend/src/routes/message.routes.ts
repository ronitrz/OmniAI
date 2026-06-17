// src/routes/message.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createMessage, streamMessage, generateJury } from '../controllers/message.controller';

const router = Router({ mergeParams: true }); // for :id from parent

router.use(authenticate);

// Session-scoped: POST /sessions/:id/messages
router.post('/', createMessage);

export default router;

// Separate router for message-level operations (mounted at /messages)
export const messageRouter = Router();
messageRouter.use(authenticate);
messageRouter.get('/:id/stream', streamMessage);
messageRouter.post('/:id/jury', generateJury);
