// src/services/ai/providers/gemini.provider.ts
// Google Gemini Flash integration via the official @google/generative-ai SDK.
// Uses streaming API for real-time token delivery.
// Constructor guarded — SDK client only created when API key is present.

import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are Gemini, a highly capable AI assistant by Google.
Provide clear, accurate, and well-structured responses.
Think through problems carefully, draw on broad knowledge, and deliver insightful, direct answers.
Be thorough but concise, and use examples where helpful.`;

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

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI | null = null;
  private readonly modelName = 'gemini-3.5-flash';
  private readonly modelId = 'gemini-flash';
  private readonly hasKey: boolean;

  constructor(apiKey?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    this.hasKey = !!key;
    if (key) {
      this.client = new GoogleGenerativeAI(key);
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'Gemini 3.5 Flash',
      fullName: 'Google Gemini 3.5',
      provider: 'google',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: '1M token context window with fast multimodal reasoning.',
      strengths: ['Speed', '1M Context', 'Multimodal'],
      color: '#4285F4',
    };
  }

  isAvailable(): boolean {
    return this.hasKey;
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
    if (!this.client) throw new Error('Gemini API key not configured');

    const startTime = Date.now();
    let fullContent = '';

    const systemPrompt = request.mode === 'research'
      ? SYSTEM_PROMPT_RESEARCH
      : (request.systemPrompt ?? SYSTEM_PROMPT_STANDARD);

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
    });

    // Build conversation history in Gemini format
    const history: Content[] = (request.history ?? []).map(turn => ({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.content }],
    }));

    const chat = model.startChat({ history });

    const result = await chat.sendMessageStream(request.prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
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
    if (!this.client) throw new Error('Gemini API key not configured');

    const startTime = Date.now();

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: request.systemPrompt ?? SYSTEM_PROMPT_STANDARD,
    });

    const result = await model.generateContent(request.prompt);
    const content = result.response.text();

    return {
      content,
      modelId: this.modelId,
      latencyMs: Date.now() - startTime,
      isMock: false,
      status: 'success',
    };
  }
}
