// src/config/prisma.ts
// Prisma client singleton — one connection shared across the app.

import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // Prevent multiple instances during development hot-reload
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
