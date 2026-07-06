// src/controllers/auth.controller.ts
// Thin HTTP layer — validates input, calls auth service, returns HTTP response.
// No business logic here.

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import * as otpService from '../services/otp.service';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
  otpCode: z.string().length(6, 'OTP code must be exactly 6 digits'),
});

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, phoneNumber } = sendOtpSchema.parse(req.body);

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError(409, 'An account with this email already exists');
    }

    // Check if phone number already exists
    const existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingPhone) {
      throw new AppError(409, 'An account with this phone number already exists');
    }

    // Generate and send OTP code
    await otpService.generateAndSendOtp(phoneNumber);

    res.json({ success: true, message: 'Verification code sent successfully' });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fullName, email, password, phoneNumber, otpCode } = registerSchema.parse(req.body);

    // Verify OTP first
    const isOtpValid = await otpService.verifyOtp(phoneNumber, otpCode);
    if (!isOtpValid) {
      throw new AppError(400, 'Invalid or expired verification code');
    }

    const result = await authService.register(fullName, email, password, phoneNumber);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  profilePicture: z.string().nullable(),
  profession: z.string().nullable().optional(),
});

const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fullName, profilePicture, profession } = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user!.userId, fullName, profilePicture, profession ?? null);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { oldPassword, newPassword } = updatePasswordSchema.parse(req.body);
    await authService.updatePassword(req.user!.userId, oldPassword, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.deleteAccount(req.user!.userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
}
