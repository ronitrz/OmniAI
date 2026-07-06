// src/services/ai/provider-registry.ts
// Central registry for all AI providers.
// This is the ONLY file that knows about specific provider implementations.
// The rest of the system calls getProvider(modelId) and gets the correct implementation.
//
// ADDING A NEW PROVIDER:
//   1. Create a new class implementing AIProvider in providers/
//   2. Add one line in the constructor: this.register('new-model-id', new NewProvider())
//   3. Done. Zero changes elsewhere.

import { AIProvider, ModelInfo } from './interfaces/ai-provider.interface';

import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { MockProvider } from './providers/mock.provider';
import { env } from '../../config/env';

// Allowed model IDs that can be requested by clients
export const SUPPORTED_MODEL_IDS = ['gemini-flash', 'deepseek-chat', 'gpt-4o', 'claude-haiku'] as const;
export type SupportedModelId = typeof SUPPORTED_MODEL_IDS[number];

class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  constructor() {
    this.register('gemini-flash', new GeminiProvider());
    this.register('deepseek-chat', new DeepSeekProvider());
    this.register('gpt-4o', new OpenAIProvider());
    this.register('claude-haiku', new AnthropicProvider());
  }

  private register(id: string, provider: AIProvider): void {
    this.providers.set(id, provider);
  }

  /**
   * Returns the provider for the given model ID.
   * If the real provider is unavailable AND MOCK_MODE is enabled,
   * transparently returns a MockProvider instead.
   * The calling code never needs to know which was returned.
   */
  getProvider(modelId: string): AIProvider {
    const provider = this.providers.get(modelId);

    if (!provider) {
      throw new Error(`Unknown model ID: "${modelId}". Supported: ${SUPPORTED_MODEL_IDS.join(', ')}`);
    }

    // Transparent mock fallback
    if (!provider.isAvailable()) {
      if (env.MOCK_MODE) {
        return new MockProvider(modelId);
      }
      throw new Error(`Provider "${modelId}" is not configured. Add the API key to .env or enable MOCK_MODE.`);
    }

    return provider;
  }

  /**
   * Returns the display info for all registered models.
   * Tier is computed at runtime: if real provider is unavailable + MOCK_MODE=true → 'demo'.
   * Used by GET /providers/models to populate the model selector UI.
   */
  getAllModelInfo(): ModelInfo[] {
    return Array.from(this.providers.entries()).map(([id, provider]) => {
      const info = provider.getModelInfo();

      // Override tier if using mock fallback
      if (!provider.isAvailable() && env.MOCK_MODE) {
        info.tier = 'demo';
      } else if (!provider.isAvailable() && !env.MOCK_MODE) {
        info.tier = 'unavailable';
      }

      return info;
    });
  }

  /**
   * Validates that a list of model IDs are all supported.
   * Throws if any unknown ID is present.
   */
  validateModelIds(modelIds: string[]): void {
    const unknown = modelIds.filter(id => !this.providers.has(id));
    if (unknown.length > 0) {
      throw new Error(`Unknown model IDs: ${unknown.join(', ')}`);
    }
  }
}

// Singleton — one registry instance for the entire application lifecycle
export const providerRegistry = new ProviderRegistry();
