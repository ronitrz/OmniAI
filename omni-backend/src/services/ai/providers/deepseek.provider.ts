// src/services/ai/providers/deepseek.provider.ts
// DeepSeek API integration using the OpenAI-compatible SDK.
// DeepSeek's API is a drop-in replacement for OpenAI's chat completion API.

import OpenAI from 'openai';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo, ConversationTurn } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are a knowledgeable AI assistant with strong analytical and coding capabilities.
Provide clear, accurate responses with practical insights. 
Focus on concrete details and actionable information.`;

const SYSTEM_PROMPT_RESEARCH = `You are a senior research analyst. Structure your response with markdown sections:

## Overview
[2-3 sentences on the topic and its significance]

## Key Findings
[3-5 bullet points of the most important findings]

## Analysis
[Deep analytical discussion — 3-4 paragraphs with reasoning and evidence]

## Risks & Considerations
[2-3 significant risks or challenges]

## Opportunities
[2-3 opportunities or strategic advantages]

## Recommendation
[Clear, actionable conclusion in 1-2 sentences]

Aim for 600-900 words. Be thorough and analytical.`;

export class DeepSeekProvider implements AIProvider {
  private client: OpenAI;
  private readonly modelName = 'deepseek-chat'; // Maps to DeepSeek-V3
  private readonly modelId = 'deepseek-chat';

  constructor() {
    this.client = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'DeepSeek',
      fullName: 'DeepSeek V3',
      provider: 'deepseek',
      tier: 'live',
      description: 'DeepSeek V3 — excellent reasoning and code generation at very low cost.',
      strengths: ['Reasoning', 'Code', 'Analysis'],
      color: '#0ea5e9',
    };
  }

  isAvailable(): boolean {
    return !!env.DEEPSEEK_API_KEY;
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

    // Add conversation history
    (request.history ?? []).forEach((turn: ConversationTurn) => {
      messages.push({
        role: turn.role,
        content: turn.content,
      });
    });

    // Add current prompt
    messages.push({ role: 'user', content: request.prompt });

    return messages;
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
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
    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: this.buildMessages(request),
      stream: false,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      response_format: request.temperature === 0 ? { type: 'json_object' } : undefined,
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
