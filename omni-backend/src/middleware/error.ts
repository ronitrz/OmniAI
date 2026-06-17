// src/middleware/error.ts
// Global Express error handler — catches any error passed to next(err).
// Logs the full error in development, returns a clean JSON response.

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.path}:`, err);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten().fieldErrors });
    return;
  }

  // Unexpected errors
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
}

