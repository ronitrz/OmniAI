// src/controllers/provider.controller.ts
// Returns all available AI models with their tier information.
// Called once on Angular app init to populate the model selector.

import { Request, Response } from 'express';
import { providerRegistry } from '../services/ai/provider-registry';

export function getModels(req: Request, res: Response): void {
  const models = providerRegistry.getAllModelInfo();
  res.json({ models });
}
