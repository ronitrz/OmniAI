// src/services/ai/sse-manager.ts
// Manages a single SSE connection for a message stream.
// Writes typed events in the SSE wire format: "data: {...}\n\n"
// Also sends heartbeat pings every 15 seconds to prevent proxy timeouts.

import { Response } from 'express';

export class SseManager {
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private closed = false;

  constructor(private res: Response) {
    // Set SSE-required headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Flush headers immediately so the client knows the connection is open
    res.flushHeaders();

    // Start heartbeat to keep the connection alive through proxies
    this.heartbeatTimer = setInterval(() => {
      this.sendRaw(': heartbeat\n\n');
    }, 15_000);
  }

  // ── Public event emitters ──────────────────────────────────────────────────

  sendModelStart(modelId: string, modelName: string): void {
    this.sendEvent('model-start', { modelId, modelName });
  }

  sendChunk(modelId: string, chunk: string): void {
    this.sendEvent('model-chunk', { modelId, chunk });
  }

  sendModelEnd(modelId: string, latencyMs: number): void {
    this.sendEvent('model-end', { modelId, latencyMs });
  }

  sendModelError(modelId: string, error: string): void {
    this.sendEvent('model-error', { modelId, error });
  }

  sendAllComplete(messageId: string): void {
    this.sendEvent('all-complete', { messageId });
    this.close();
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private sendEvent(event: string, data: object): void {
    const payload = JSON.stringify({ event, ...data });
    this.sendRaw(`data: ${payload}\n\n`);
  }

  private sendRaw(text: string): void {
    if (this.closed) return;
    try {
      this.res.write(text);
    } catch {
      // Client disconnected — stop writing
      this.close();
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    try {
      this.res.end();
    } catch {
      // Already ended
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}
