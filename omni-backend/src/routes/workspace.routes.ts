// src/routes/workspace.routes.ts

import { Router } from 'express';
import { list, create, update, remove } from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // All workspace routes require auth

router.get('/', list);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;
