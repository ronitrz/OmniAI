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

export class DeepSeekProvider implements AIProvider {
  private client: OpenAI | null = null;
  private readonly modelName = 'deepseek-reasoner'; // Maps to DeepSeek-R1 (reasoning model)
  private readonly modelId = 'deepseek-chat';
  private readonly hasKey: boolean;

  constructor(apiKey?: string) {
    const key = apiKey || env.DEEPSEEK_API_KEY;
    this.hasKey = !!key;
    if (key) {
      this.client = new OpenAI({
        apiKey: key,
        baseURL: 'https://api.deepseek.com/v1',
      });
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'DeepSeek R1',
      fullName: 'DeepSeek R1',
      provider: 'deepseek',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: 'Frontier chain-of-thought reasoning model for math, code, and analysis.',
      strengths: ['Chain-of-Thought', 'Math & Code', 'Analysis'],
      color: '#0ea5e9',
    };
  }

  isAvailable(): boolean {
    return this.hasKey;
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
