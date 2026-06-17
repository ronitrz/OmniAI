// src/services/ai/providers/anthropic.provider.ts
// Anthropic Claude integration. Uses MockProvider when no API key is set.
// Note: @anthropic-ai/sdk is NOT listed in package.json to keep dependencies lean.
// If you add ANTHROPIC_API_KEY, install it: npm install @anthropic-ai/sdk

import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo } from '../interfaces/ai-provider.interface';
import { env } from '../../../config/env';

// This provider returns unavailable when no key is set.
// The ProviderRegistry will substitute a MockProvider automatically.
export class AnthropicProvider implements AIProvider {
  private readonly modelId = 'claude-haiku';

  getModelInfo(): ModelInfo {
    return {
      id: this.modelId,
      displayName: 'Claude',
      fullName: 'Claude Haiku',
      provider: 'anthropic',
      tier: this.isAvailable() ? 'live' : 'demo',
      description: this.isAvailable()
        ? 'Anthropic Claude Haiku — analytical, nuanced reasoning.'
        : 'Anthropic Claude Haiku — Demo Mode. Add ANTHROPIC_API_KEY to enable live.',
      strengths: ['Analysis', 'Nuanced reasoning', 'Writing'],
      color: '#c9a227',
    };
  }

  isAvailable(): boolean {
    return !!env.ANTHROPIC_API_KEY;
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
    // This method is only called if isAvailable() returns true.
    // If you add ANTHROPIC_API_KEY, implement the streaming here using @anthropic-ai/sdk.
    // The ProviderRegistry wraps this with MockProvider when isAvailable() is false.
    throw new Error('Anthropic streaming not yet implemented. Add @anthropic-ai/sdk to implement.');
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    throw new Error('Anthropic response not yet implemented.');
  }
}
