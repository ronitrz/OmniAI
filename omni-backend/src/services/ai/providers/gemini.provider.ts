// src/services/ai/providers/gemini.provider.ts
// Google Gemini Flash integration via the official @google/generative-ai SDK.
// Uses streaming API for real-time token delivery.

import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

const SYSTEM_PROMPT_STANDARD = `You are a knowledgeable and helpful AI assistant. 
Provide clear, accurate, and well-structured responses. 
Be direct and informative without unnecessary padding.`;

const SYSTEM_PROMPT_RESEARCH = `You are a senior research analyst conducting a professional analysis. 
Structure your response with the following sections using markdown headers:

## Overview
[2-3 sentences on the topic and its significance]

## Key Findings  
[3-5 bullet points of the most important findings and insights]

## Analysis
[Deep analytical discussion with supporting reasoning — 3-4 paragraphs]

## Risks & Considerations
[2-3 significant risks, challenges, or caveats]

## Opportunities
[2-3 opportunities, upsides, or recommended next steps]

## Recommendation
[1-2 sentences with a clear, actionable conclusion]

Be thorough and evidence-based. Aim for 600-900 words total.`;

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private readonly modelName = 'gemini-2.0-flash';
  private readonly modelId = 'gemini-flash';

  constructor() {
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'Gemini',
      fullName: 'Gemini 2.0 Flash',
      provider: 'google',
      tier: 'live',
      description: 'Google Gemini 2.0 Flash — fast, capable, 1M token context window.',
      strengths: ['Speed', 'Long context', 'Multimodal'],
      color: '#4285F4',
    };
  }

  isAvailable(): boolean {
    return !!env.GEMINI_API_KEY;
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
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
