// src/services/auth.service.ts
// Handles user registration, login, and token generation.
// All password hashing and JWT operations live here — not in controllers.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/error';
import type { JwtPayload } from '../middleware/auth';

const SALT_ROUNDS = 12;

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
  };
}

export async function register(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResult> {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { fullName, email, passwordHash },
    select: { id: true, email: true, fullName: true, profilePicture: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { token, user };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken({ userId: user.id, email: user.email });
  const { passwordHash: _, ...safeUser } = user;
  return { token, user: safeUser };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, profilePicture: true, profession: true, createdAt: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

export async function updateProfile(userId: string, fullName: string, profilePicture: string | null, profession: string | null) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { fullName, profilePicture, profession },
    select: { id: true, email: true, fullName: true, profilePicture: true, profession: true, createdAt: true },
  });
  return user;
}

export async function updatePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(400, 'Incorrect current password');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
}

export async function deleteAccount(userId: string) {
  // Cascades are handled via schema definitions
  await prisma.user.delete({
    where: { id: userId }
  });
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}
