// src/middleware/validate.ts
// Factory function that returns a middleware validating req.body against a Zod schema.
// Returns 400 with field errors if validation fails.

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    req.body = result.data; // Replace body with parsed + typed data
    next();
  };
}
