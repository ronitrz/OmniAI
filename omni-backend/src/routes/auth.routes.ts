// src/routes/auth.routes.ts

import { Router } from 'express';
import { register, login, me, sendOtp, updateProfile, updatePassword, deleteAccount } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);
router.delete('/account', authenticate, deleteAccount);

export default router;
