// src/controllers/workspace.controller.ts
// All workspace CRUD operations. Ensures users can only access their own workspaces.

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  // req.params values are always strings in Express routes
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { userId: req.user!.userId },
      include: {
        _count: { select: { sessions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description } = createSchema.parse(req.body);
    const workspace = await prisma.workspace.create({
      data: { name, description, userId: req.user!.userId },
    });
    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const data = updateSchema.parse(req.body);

    const workspace = await prisma.workspace.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!workspace) throw new AppError(404, 'Workspace not found');

    const updated = await prisma.workspace.update({ where: { id }, data });
    res.json({ workspace: updated });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const workspace = await prisma.workspace.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!workspace) throw new AppError(404, 'Workspace not found');

    await prisma.workspace.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
