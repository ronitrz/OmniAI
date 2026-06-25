// src/routes/provider.routes.ts

import { Router } from 'express';
import { getModels } from '../controllers/provider.controller';

const router = Router();

// Providers endpoint is public — allows guest users to see the model list
router.get('/models', getModels);

export default router;
