// src/services/ai/providers/anthropic.provider.ts
// Anthropic Claude integration via the official @anthropic-ai/sdk.
// Uses Claude 3.5 Haiku — fast, analytical, excellent at nuanced reasoning.
// Uses MockProvider transparently when no API key is set.

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo, ConversationTurn } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are Claude, an AI assistant created by Anthropic.
Provide thoughtful, nuanced, and well-structured responses.
Consider multiple perspectives and acknowledge uncertainty where appropriate.
Be direct and helpful while maintaining intellectual honesty.`;

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
  private readonly modelName = 'claude-3-5-haiku-latest';
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
      fullName: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: this.isAvailable()
        ? 'Anthropic Claude 3.5 Haiku — analytical, nuanced reasoning with intellectual honesty.'
        : 'Anthropic Claude 3.5 Haiku — Demo Mode. Add ANTHROPIC_API_KEY to enable live.',
      strengths: ['Analysis', 'Nuanced reasoning', 'Writing'],
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
      max_tokens: request.maxTokens ?? 2048,
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
      max_tokens: request.maxTokens ?? 2048,
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
