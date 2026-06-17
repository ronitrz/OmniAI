// src/services/ai/orchestrator.ts
// Executes all selected AI providers concurrently and streams results via SSE.
//
// Key design decisions:
// - Promise.allSettled() ensures one failing provider never blocks the others
// - Each provider gets an independent try-catch — errors are per-model, not global
// - Responses are saved to DB as they complete, not after all complete
// - Conversation history is fetched and passed to each provider for multi-turn context
// - Each model gets ITS OWN conversation history (not a blended transcript)

import { prisma } from '../../config/prisma';
import { providerRegistry } from './provider-registry';
import { SseManager } from './sse-manager';
import { AIRequest, ConversationTurn } from './interfaces/ai-provider.interface';

const MODEL_TIMEOUT_MS = 60_000; // 60 second hard timeout per model

export async function executeAll(
  messageId: string,
  selectedModelIds: string[],
  prompt: string,
  mode: 'standard' | 'research',
  sessionId: string,
  sse: SseManager
): Promise<void> {
  // Build conversation history for context (multi-turn support)
  // Each model gets its own history: only messages from that model
  const allMessages = await prisma.message.findMany({
    where: { sessionId },
    include: { responses: true },
    orderBy: { createdAt: 'asc' },
  });

  // Execute all models concurrently
  const modelTasks = selectedModelIds.map(async (modelId) => {
    const provider = providerRegistry.getProvider(modelId);
    const modelInfo = provider.getModelInfo();

    // Signal the client that this model is starting
    sse.sendModelStart(modelId, modelInfo.displayName);

    // Build this model's conversation history from past messages
    const history = buildModelHistory(allMessages, modelId, messageId);

    const request: AIRequest = {
      prompt,
      mode,
      history,
      maxTokens: mode === 'research' ? 2000 : 1024,
      temperature: 0.7,
    };

    const startTime = Date.now();

    try {
      // Wrap in timeout to prevent hanging connections
      const response = await withTimeout(
        provider.streamResponse(request, (chunk, id) => {
          if (!sse.isClosed) sse.sendChunk(id, chunk);
        }),
        MODEL_TIMEOUT_MS,
        modelId
      );

      // Save completed response to DB
      await prisma.modelResponse.create({
        data: {
          messageId,
          modelId,
          modelName: modelInfo.displayName,
          content: response.content,
          isMock: response.isMock,
          status: 'success',
          latencyMs: response.latencyMs,
        },
      });

      sse.sendModelEnd(modelId, response.latencyMs);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const latency = Date.now() - startTime;

      console.error(`[Orchestrator] ${modelId} failed:`, errorMsg);

      // Save error response to DB
      await prisma.modelResponse.create({
        data: {
          messageId,
          modelId,
          modelName: modelInfo.displayName,
          content: '',
          isMock: false,
          status: errorMsg.includes('timeout') ? 'timeout' : 'error',
          latencyMs: latency,
        },
      });

      sse.sendModelError(modelId, errorMsg);
    }
  });

  // Wait for all models to finish (success or failure)
  await Promise.allSettled(modelTasks);

  // Auto-title the session from the first message if it is still "New Conversation"
  await autoTitleSession(sessionId, prompt);

  // Signal all complete — client will trigger jury verdict
  sse.sendAllComplete(messageId);
}

// Build the conversation history for a specific model
// Each model receives only its own past responses as "assistant" turns
function buildModelHistory(
  allMessages: Array<{
    id: string;
    role: string;
    content: string;
    responses: Array<{ modelId: string; content: string; status: string }>;
  }>,
  modelId: string,
  currentMessageId: string
): ConversationTurn[] {
  const history: ConversationTurn[] = [];

  for (const message of allMessages) {
    // Stop before the current message being processed
    if (message.id === currentMessageId) break;

    if (message.role === 'user') {
      history.push({ role: 'user', content: message.content });

      // Find this model's response for this turn
      const modelResponse = message.responses.find(
        r => r.modelId === modelId && r.status === 'success'
      );

      if (modelResponse?.content) {
        history.push({ role: 'assistant', content: modelResponse.content });
      }
    }
  }

  return history;
}

// Auto-generate session title from the first user message
async function autoTitleSession(sessionId: string, prompt: string): Promise<void> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.title !== 'New Conversation') return;

  // Use first 60 chars of the prompt as the title
  const title = prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt;
  await prisma.session.update({ where: { id: sessionId }, data: { title } });
}

// Wraps a promise with a timeout that rejects after the given duration
function withTimeout<T>(promise: Promise<T>, ms: number, modelId: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${modelId} request timed out after ${ms / 1000}s`));
    }, ms);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
