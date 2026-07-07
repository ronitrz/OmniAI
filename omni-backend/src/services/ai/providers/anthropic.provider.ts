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

const SYSTEM_PROMPT_RESEARCH = `You are a Principal Lead Research Analyst conducting a high-intelligence, multi-perspective investigation.

Provide deep analytical rigor (700-1000 words) using these exact markdown section headings:

## Executive Summary
[Synthesize the core problem, high-level thesis, and strategic implications in 3-4 dense, insightful sentences.]

## Key Findings
[Provide 4-6 detailed, evidence-backed findings with concrete metrics, architectural choices, or factual data.]

## Strategic Analysis & Mechanics
[Deep, rigorous multi-paragraph analytical discussion exploring underlying principles, trade-offs, and systemic context.]

## Agreements & Consensus Points
[Highlight core consensus facts, undisputed industry standards, or shared principles related to this topic.]

## Contradictions & Risk Factors
[Critically analyze failure modes, operational risks, edge cases, trade-offs, and points of debate.]

## Strategic Conclusion
[Delivers a clear, prioritized, step-by-step recommendation and actionable roadmap.]`;

export class AnthropicProvider implements AIProvider {
  private client: Anthropic | null = null;
  private readonly modelName = 'claude-sonnet-5';
  private readonly modelId = 'claude-haiku';
  private readonly hasKey: boolean;

  constructor(apiKey?: string) {
    const key = apiKey || env.ANTHROPIC_API_KEY;
    this.hasKey = !!key;
    if (key) {
      this.client = new Anthropic({ apiKey: key });
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'Claude Sonnet 5',
      fullName: 'Anthropic Claude 5',
      provider: 'anthropic',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: 'Flagship model for writing, deep analytical reasoning, and complex tasks.',
      strengths: ['Writing', 'Deep Reasoning', 'Agents'],
      color: '#c9a227',
    };
  }

  isAvailable(): boolean {
    return this.hasKey;
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
