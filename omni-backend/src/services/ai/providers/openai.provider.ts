// src/services/ai/providers/openai.provider.ts
// OpenAI GPT integration. Uses MockProvider transparently when no API key is set.
// When OPENAI_API_KEY is present, this provider uses real GPT-4o Mini streaming.

import OpenAI from 'openai';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo, ConversationTurn } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are GPT-4o, a highly capable AI assistant created by OpenAI.
Provide clear, practical, and well-structured responses.
Use concrete examples and actionable recommendations when appropriate.`;

const SYSTEM_PROMPT_RESEARCH = `You are GPT-4o acting as a research analyst. Use markdown sections:

## Overview
[2-3 sentences on the topic]

## Key Findings
[3-5 bullet points]

## Analysis
[3-4 paragraphs of deep analysis]

## Risks & Considerations
[2-3 risks]

## Opportunities  
[2-3 opportunities]

## Recommendation
[Clear conclusion]

Aim for 600-900 words.`;

export class OpenAIProvider implements AIProvider {
  private client: OpenAI | null = null;
  private readonly modelName = 'gpt-4o-mini';
  private readonly modelId = 'gpt-4o';

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'GPT-4o',
      fullName: 'GPT-4o Mini',
      provider: 'openai',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: this.isAvailable()
        ? 'OpenAI GPT-4o Mini — fast, practical, excellent at instruction following.'
        : 'OpenAI GPT-4o Mini — Demo Mode. Add OPENAI_API_KEY to enable live.',
      strengths: ['Code', 'Instruction following', 'Tool use'],
      color: '#10a37f',
    };
  }

  isAvailable(): boolean {
    return !!env.OPENAI_API_KEY;
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
