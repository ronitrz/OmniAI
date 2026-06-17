// src/services/ai/interfaces/ai-provider.interface.ts
// The core abstraction. Every AI provider — real or mock — implements this interface.
// The rest of the system ONLY talks to AIProvider, never to specific providers directly.
// This is the Strategy Pattern applied to AI providers.

export type ModelTier = 'live' | 'demo' | 'unavailable';

export interface ModelInfo {
  id: string;           // Internal ID: "gemini-flash"
  displayName: string;  // UI label: "Gemini"
  fullName: string;     // Full name: "Gemini 2.0 Flash"
  provider: string;     // "google" | "deepseek" | "openai" | "anthropic" | "mock"
  tier: ModelTier;      // Computed at runtime based on API key presence
  description: string;
  strengths: string[];  // ["Speed", "Long context"] — shown in model selector
  color: string;        // Brand color hex for UI: "#4285F4"
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  history?: ConversationTurn[];  // Previous turns for multi-turn context
  mode?: 'standard' | 'research'; // Affects system prompt selection
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  modelId: string;
  latencyMs: number;
  isMock: boolean;  // Internal only — never sent to Angular frontend
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

// Called on each streaming chunk — passes text + modelId so orchestrator
// can route chunks to the correct SSE channel
export type ChunkCallback = (chunk: string, modelId: string) => void;

export interface AIProvider {
  /** Returns metadata about this provider for the model selector UI */
  getModelInfo(): ModelInfo;

  /** Returns true if the API key is configured and the provider is usable */
  isAvailable(): boolean;

  /**
   * Streams a response token-by-token via the onChunk callback.
   * Resolves with the full response when streaming is complete.
   */
  streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse>;

  /**
   * Non-streaming response — used for internal utility calls
   * (e.g., jury extraction, synthesis prompts).
   */
  generateResponse(request: AIRequest): Promise<AIResponse>;
}
