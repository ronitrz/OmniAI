// src/routes/provider.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getModels } from '../controllers/provider.controller';

const router = Router();

// Providers endpoint is protected — only logged-in users see the model list
router.get('/models', authenticate, getModels);

export default router;
