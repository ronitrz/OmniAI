// src/controllers/session.controller.ts
// Handles session CRUD and full message history retrieval.
// All req.params values are cast to string — Express always provides strings for params.

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';

const createSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200),
});

async function assertWorkspaceOwnership(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId },
  });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  return workspace;
}

async function assertSessionOwnership(sessionId: string, userId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, workspace: { userId } },
  });
  if (!session) throw new AppError(404, 'Session not found');
  return session;
}

export async function listByWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspaceId = req.params.workspaceId as string;
    await assertWorkspaceOwnership(workspaceId, req.user!.userId);

    const sessions = await prisma.session.findMany({
      where: { workspaceId },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspaceId = req.params.workspaceId as string;
    await assertWorkspaceOwnership(workspaceId, req.user!.userId);

    const { title } = createSchema.parse(req.body);
    const session = await prisma.session.create({
      data: { title: title ?? 'New Conversation', workspaceId },
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { title } = updateSchema.parse(req.body);
    await assertSessionOwnership(id, req.user!.userId);

    const session = await prisma.session.update({ where: { id }, data: { title } });
    res.json({ session });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    await assertSessionOwnership(id, req.user!.userId);

    await prisma.session.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const session = await assertSessionOwnership(id, req.user!.userId);

    const messages = await prisma.message.findMany({
      where: { sessionId: id },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            modelId: true,
            modelName: true,
            content: true,
            status: true,
            latencyMs: true,
            // isMock intentionally excluded — never sent to frontend
          },
        },
        juryVerdict: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ messages, session });
  } catch (err) {
    next(err);
  }
}

