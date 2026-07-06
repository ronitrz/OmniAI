// src/services/ai/providers/anthropic.provider.ts
// Anthropic Claude integration via the official @anthropic-ai/sdk.
// Uses Claude 3.5 Haiku — fast, analytical, excellent at nuanced reasoning.
// Uses MockProvider transparently when no API key is set.

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo, ConversationTurn } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are Claude, an AI assistant created by Anthropic.
Provide deeply thoughtful, nuanced, and exceptionally well-structured responses.
Reason step-by-step through complex problems, consider multiple perspectives, and acknowledge uncertainty where appropriate.
Be precise, intellectually honest, and aim for the highest quality answer possible.`;

const SYSTEM_PROMPT_RESEARCH = `You are Claude acting as a senior research analyst. Structure your response with markdown sections:

## Overview
[2-3 sentences on the topic and its significance]

## Key Findings
[3-5 bullet points of the most important findings]

## Analysis
[Deep analytical discussion — 3-4 paragraphs with evidence and reasoning]

## Risks & Considerations
[2-3 significant risks, challenges, or caveats]

## Opportunities
[2-3 opportunities or strategic recommendations]

## Recommendation
[Clear, actionable conclusion in 1-2 sentences]

Be thorough, evidence-based, and intellectually honest. Aim for 600-900 words.`;

export class AnthropicProvider implements AIProvider {
  private client: Anthropic | null = null;
  private readonly modelName = 'claude-sonnet-4-5';
  private readonly modelId = 'claude-haiku';

  constructor() {
    if (env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'Claude',
      fullName: 'Claude Sonnet 4.5',
      provider: 'anthropic',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: this.isAvailable()
        ? 'Anthropic Claude Sonnet 4.5 — frontier intelligence with exceptional reasoning and nuanced analysis.'
        : 'Anthropic Claude Sonnet 4.5 — Demo Mode. Add ANTHROPIC_API_KEY to enable live.',
      strengths: ['Deep reasoning', 'Analysis', 'Writing'],
      color: '#c9a227',
    };
  }

  isAvailable(): boolean {
    return !!env.ANTHROPIC_API_KEY;
  }

  private buildMessages(
    request: AIRequest
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    (request.history ?? []).forEach((turn: ConversationTurn) => {
      messages.push({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.content,
      });
    });

    // Add current prompt
    messages.push({ role: 'user', content: request.prompt });

    return messages;
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
    if (!this.client) throw new Error('Anthropic API key not configured');

    const startTime = Date.now();
    let fullContent = '';

    const systemPrompt = request.mode === 'research'
      ? SYSTEM_PROMPT_RESEARCH
      : (request.systemPrompt ?? SYSTEM_PROMPT_STANDARD);

    const stream = this.client.messages.stream({
      model: this.modelName,
      system: systemPrompt,
      messages: this.buildMessages(request),
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        if (text) {
          fullContent += text;
          onChunk(text, this.modelId);
        }
      }
    }

    return {
      content: fullContent,
      modelId: this.modelId,
      latencyMs: Date.now() - startTime,
      isMock: false,
      status: 'success',
    };
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.client) throw new Error('Anthropic API key not configured');

    const startTime = Date.now();

    const systemPrompt = request.mode === 'research'
      ? SYSTEM_PROMPT_RESEARCH
      : (request.systemPrompt ?? SYSTEM_PROMPT_STANDARD);

    const response = await this.client.messages.create({
      model: this.modelName,
      system: systemPrompt,
      messages: this.buildMessages(request),
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    });

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as Anthropic.TextBlock).text)
      .join('');

    return {
      content,
      modelId: this.modelId,
      latencyMs: Date.now() - startTime,
      isMock: false,
      status: 'success',
    };
  }
}
