// src/controllers/message.controller.ts
// Three endpoints:
//   POST /sessions/:id/messages   — saves user message, returns messageId
//   GET  /messages/:id/stream     — SSE endpoint: executes AI models concurrently
//   POST /messages/:id/jury       — generates Jury Verdict from completed responses

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import { providerRegistry, SUPPORTED_MODEL_IDS, UserKeys } from '../services/ai/provider-registry';
import { SseManager } from '../services/ai/sse-manager';
import { executeAll } from '../services/ai/orchestrator';
import { extractClaims } from '../services/jury/extractor';
import { calculateConfidence } from '../services/jury/scorer';
import { synthesizeVerdict } from '../services/jury/synthesizer';

const createMessageSchema = z.object({
  content: z.string().min(1, 'Prompt cannot be empty').max(4000),
  selectedModels: z
    .array(z.string())
    .min(1, 'Select at least one model')
    .max(4, 'Maximum 4 models')
    .refine(
      (ids) => ids.every(id => (SUPPORTED_MODEL_IDS as readonly string[]).includes(id)),
      { message: 'One or more invalid model IDs' }
    ),
  mode: z.enum(['standard', 'research']).default('standard'),
});

// POST /sessions/:id/messages
export async function createMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.params.id as string;

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, workspace: { userId: req.user!.userId } },
    });
    if (!session) throw new AppError(404, 'Session not found');

    const { content, selectedModels, mode } = createMessageSchema.parse(req.body);

    const message = await prisma.message.create({
      data: { role: 'user', content, selectedModels, mode, sessionId },
    });

    // Touch session updatedAt so it rises to the top of the list
    await prisma.session.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

    res.status(201).json({ messageId: message.id });
  } catch (err) {
    next(err);
  }
}

// GET /messages/:id/stream  — SSE endpoint
export async function streamMessage(req: Request, res: Response): Promise<void> {
  const messageId = req.params.id as string;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      session: { workspace: { userId: req.user!.userId } },
    },
  });

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  // Parse user-supplied API keys from header (sent by frontend from localStorage)
  let userKeys: Record<string, string> | undefined;
  const userKeysHeader = req.headers['x-user-keys'] as string | undefined;
  if (userKeysHeader) {
    try {
      const parsed = JSON.parse(userKeysHeader);
      if (typeof parsed === 'object' && parsed !== null) {
        userKeys = parsed;
      }
    } catch {
      // Ignore malformed header — fall back to env keys / mock
    }
  }

  const sse = new SseManager(res);

  req.on('close', () => sse.close());

  try {
    await executeAll(
      messageId,
      message.selectedModels,
      message.content,
      message.mode as 'standard' | 'research',
      message.sessionId,
      sse,
      userKeys
    );
  } catch (err) {
    console.error('[Stream] Orchestrator error:', err);
    sse.close();
  }
}


// POST /messages/:id/jury
export async function generateJury(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messageId = req.params.id as string;

    // Idempotent — return existing verdict if it already exists
    const existing = await prisma.juryVerdict.findUnique({ where: { messageId } });
    if (existing) {
      res.json({ juryVerdict: existing });
      return;
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        session: { workspace: { userId: req.user!.userId } },
      },
      include: {
        responses: {
          where: { status: 'success' },
          select: { modelId: true, modelName: true, content: true },
        },
      },
    });

    if (!message) throw new AppError(404, 'Message not found');
    if (message.responses.length === 0) {
      throw new AppError(400, 'No successful model responses found for this message');
    }

    // Parse user-supplied API keys from header (sent by frontend from localStorage)
    let userKeys: UserKeys | undefined;
    const userKeysHeader = req.headers['x-user-keys'] as string | undefined;
    if (userKeysHeader) {
      try {
        const parsed = JSON.parse(userKeysHeader);
        if (typeof parsed === 'object' && parsed !== null) {
          userKeys = parsed;
        }
      } catch {
        // Ignore malformed header — fall back to env keys / mock
      }
    }

    // Three-stage jury pipeline
    console.log(`[Jury Engine] Generating verdict for Message ID: "${messageId}"`);
    console.log(`[Jury Engine] Input user prompt: "${message.content}"`);
    console.log(`[Jury Engine] Responses passed into extractor:\n`, JSON.stringify(message.responses, null, 2));

    const extraction = await extractClaims(message.content, message.responses, userKeys);
    console.log(`[Jury Engine] Extracted claims:\n`, JSON.stringify(extraction, null, 2));

    const scoring = calculateConfidence(extraction);
    console.log(`[Jury Engine] Scored confidence: ${scoring.confidenceScore} (${scoring.confidenceLabel})`);

    console.log(`[Jury Engine] Responses passed into synthesizer:\n`, JSON.stringify(message.responses, null, 2));
    const synthesis = await synthesizeVerdict(
      message.content,
      message.responses,
      extraction,
      scoring,
      userKeys
    );
    console.log(`[Jury Engine] Synthesized synthesis response:\n`, JSON.stringify(synthesis, null, 2));

    const juryVerdict = await prisma.juryVerdict.create({
      data: {
        messageId,
        consensusText: synthesis.consensusText,
        confidenceScore: scoring.confidenceScore,
        confidenceLabel: scoring.confidenceLabel,
        agreements: extraction.agreements,
        contradictions: extraction.contradictions,
        uniqueInsights: extraction.uniqueInsights,
        recommendation: synthesis.recommendation,
      },
    });

    console.log(`[Jury Engine] Final verdict payload created in DB:\n`, JSON.stringify(juryVerdict, null, 2));
    res.json({ juryVerdict });
  } catch (err) {
    next(err);
  }
}
