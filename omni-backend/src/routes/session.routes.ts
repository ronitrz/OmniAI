// src/routes/session.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listByWorkspace,
  create,
  update,
  remove,
  getMessages,
} from '../controllers/session.controller';

const router = Router({ mergeParams: true }); // mergeParams to access :workspaceId

router.use(authenticate);

// Workspace-scoped session routes (mounted at /workspaces/:workspaceId/sessions)
router.get('/', listByWorkspace);
router.post('/', create);

// Session-specific routes (mounted at /sessions)
router.patch('/:id', update);
router.delete('/:id', remove);
router.get('/:id/messages', getMessages);

export default router;
