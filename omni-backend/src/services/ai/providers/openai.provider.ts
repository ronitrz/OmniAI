// src/services/ai/providers/openai.provider.ts
// OpenAI GPT integration. Uses MockProvider transparently when no API key is set.
// When OPENAI_API_KEY is present, this provider uses real GPT-4o Mini streaming.

import OpenAI from 'openai';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo, ConversationTurn } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are GPT-5.4, a highly capable AI assistant created by OpenAI.
Provide clear, practical, and well-structured responses.
Use concrete examples, step-by-step reasoning, and actionable recommendations.
Be thorough and precise, especially on technical and nuanced topics.`;

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

export class OpenAIProvider implements AIProvider {
  private client: OpenAI | null = null;
  private readonly modelName = 'gpt-5';
  private readonly modelId = 'gpt-4o';
  private readonly hasKey: boolean;

  constructor(apiKey?: string) {
    const key = apiKey || env.OPENAI_API_KEY;
    this.hasKey = !!key;
    if (key) {
      this.client = new OpenAI({ apiKey: key });
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'GPT-5',
      fullName: 'OpenAI GPT-5',
      provider: 'openai',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: 'Advanced intelligence for coding, logic, and professional reasoning.',
      strengths: ['Reasoning', 'Code', 'Agents'],
      color: '#10a37f',
    };
  }

  isAvailable(): boolean {
    return this.hasKey;
  }

  private buildMessages(
    request: AIRequest
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const systemPrompt = request.mode === 'research'
      ? SYSTEM_PROMPT_RESEARCH
      : (request.systemPrompt ?? SYSTEM_PROMPT_STANDARD);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    (request.history ?? []).forEach((turn: ConversationTurn) => {
      messages.push({ role: turn.role, content: turn.content });
    });

    messages.push({ role: 'user', content: request.prompt });
    return messages;
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
    if (!this.client) throw new Error('OpenAI API key not configured');

    const startTime = Date.now();
    let fullContent = '';

    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages: this.buildMessages(request),
      stream: true,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        fullContent += text;
        onChunk(text, this.modelId);
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
    if (!this.client) throw new Error('OpenAI API key not configured');

    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: this.buildMessages(request),
      stream: false,
      max_tokens: request.maxTokens ?? 2048,
      response_format: request.jsonMode ? { type: 'json_object' } : undefined,
    });

    const content = response.choices[0]?.message?.content ?? '';

    return {
      content,
      modelId: this.modelId,
      latencyMs: Date.now() - startTime,
      isMock: false,
      status: 'success',
    };
  }
}
