// src/services/ai/providers/deepseek.provider.ts
// DeepSeek API integration using the OpenAI-compatible SDK.
// DeepSeek's API is a drop-in replacement for OpenAI's chat completion API.
// Constructor guarded — client only created when API key is present.

import OpenAI from 'openai';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo, ConversationTurn } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are a highly intelligent AI assistant with exceptional analytical and reasoning capabilities.
Think through problems step-by-step with rigorous logic.
Provide accurate, well-structured responses with depth and precision.
Focus on concrete details, actionable insights, and comprehensive coverage of the topic.`;

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
  private client: OpenAI | null = null;
  private readonly modelName = 'deepseek-reasoner'; // Maps to DeepSeek-R1 (reasoning model)
  private readonly modelId = 'deepseek-chat';

  constructor() {
    if (env.DEEPSEEK_API_KEY) {
      this.client = new OpenAI({
        apiKey: env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
      });
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'DeepSeek',
      fullName: 'DeepSeek R1',
      provider: 'deepseek',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: this.isAvailable()
        ? 'DeepSeek R1 — frontier reasoning model with chain-of-thought thinking, rivaling o1-class intelligence.'
        : 'DeepSeek R1 — Demo Mode. Add DEEPSEEK_API_KEY to enable live.',
      strengths: ['Chain-of-thought reasoning', 'Math & Code', 'Analysis'],
      color: '#0ea5e9',
    };
  }

  isAvailable(): boolean {
    return !!env.DEEPSEEK_API_KEY;
  }

  private buildMessages(
    request: AIRequest
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    // deepseek-reasoner does not support system role — prepend context to first user message
    const systemContext = request.mode === 'research'
      ? SYSTEM_PROMPT_RESEARCH
      : (request.systemPrompt ?? SYSTEM_PROMPT_STANDARD);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add conversation history
    (request.history ?? []).forEach((turn: ConversationTurn) => {
      messages.push({
        role: turn.role,
        content: turn.content,
      });
    });

    // Prepend system context into the user's current message
    const userContent = messages.length === 0
      ? `${systemContext}\n\nUser: ${request.prompt}`
      : request.prompt;

    messages.push({ role: 'user', content: userContent });

    return messages;
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
    if (!this.client) throw new Error('DeepSeek API key not configured');

    const startTime = Date.now();
    let fullContent = '';

    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages: this.buildMessages(request),
      stream: true,
      max_tokens: request.maxTokens ?? 8000,
      temperature: 0, // DeepSeek R1 requires temperature=0 for deterministic chain-of-thought
    });

    for await (const chunk of stream) {
      // Skip reasoning_content tokens — only emit the final answer content
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
    if (!this.client) throw new Error('DeepSeek API key not configured');

    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: this.buildMessages(request),
      stream: false,
      max_tokens: request.maxTokens ?? 8000,
      temperature: 0, // DeepSeek R1 requires temperature=0
      // Note: deepseek-reasoner does not support response_format / json_mode
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
