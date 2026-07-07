// src/services/jury/extractor.ts
// Extracts structured claims from all model responses using a fast, cheap AI call.
// Uses a provider fallback chain: gemini → openai → deepseek → claude → any available.
// Returns structured agreements, contradictions, and unique insights.

import { providerRegistry, UserKeys } from '../ai/provider-registry';
import { AIProvider } from '../ai/interfaces/ai-provider.interface';

export interface ExtractionResult {
  agreements: string[];
  contradictions: Array<{
    topic: string;
    positions: Record<string, string>; // modelId → their position
  }>;
  uniqueInsights: Array<{
    modelId: string;
    insight: string;
  }>;
}

export interface ModelResponseInput {
  modelId: string;
  modelName: string;
  content: string;
}

// Provider fallback chain for jury calls — prefer cheap/fast models
const JURY_PROVIDER_CHAIN = ['gemini-flash', 'gpt-4o', 'deepseek-chat', 'claude-haiku'];

/**
 * Attempts to get a working provider from the fallback chain.
 * Returns the first provider that can be resolved (real or mock).
 */
function getJuryProvider(userKeys?: UserKeys): AIProvider {
  for (const modelId of JURY_PROVIDER_CHAIN) {
    try {
      return userKeys
        ? providerRegistry.getProviderWithUserKeys(modelId, userKeys)
        : providerRegistry.getProvider(modelId);
    } catch {
      continue;
    }
  }
  throw new Error('No AI provider available for jury extraction');
}

export async function extractClaims(
  prompt: string,
  responses: ModelResponseInput[],
  userKeys?: UserKeys
): Promise<ExtractionResult> {
  // Filter out empty/invalid responses — only process successful ones
  const validResponses = responses.filter(r => r.content.trim().length > 2);

  if (validResponses.length === 0) {
    return { agreements: [], contradictions: [], uniqueInsights: [] };
  }

  if (validResponses.length === 1) {
    // Can't compare a single response — return it as a unique insight
    return {
      agreements: [],
      contradictions: [],
      uniqueInsights: [{ modelId: validResponses[0].modelId, insight: 'Only one model responded successfully.' }],
    };
  }

  // Format responses for the extraction prompt
  const formattedResponses = validResponses
    .map(r => `### ${r.modelName} (${r.modelId})\n${r.content}`)
    .join('\n\n---\n\n');

  const extractionPrompt = `You are analyzing responses from multiple AI models to the same question.

QUESTION: ${prompt}

AI MODEL RESPONSES:
${formattedResponses}

Analyze these responses and extract the following. Return ONLY valid JSON, no markdown, no explanation:

{
  "agreements": [
    "A specific point that 2 or more models clearly agreed on",
    "Another agreement point"
  ],
  "contradictions": [
    {
      "topic": "The specific topic where models disagreed",
      "positions": {
        "modelId1": "What that model said about this topic",
        "modelId2": "What the other model said about this topic"
      }
    }
  ],
  "uniqueInsights": [
    {
      "modelId": "the-model-id",
      "insight": "A specific point only this model raised that the others did not mention"
    }
  ]
}

Rules:
- Maximum 5 agreements, 3 contradictions, 1 unique insight per model
- Be specific — use the models' actual content, not generic statements  
- Only include real contradictions where models assert different things
- Only include genuine unique insights not mentioned by other models
- Use the exact modelId strings from the responses above`;

  try {
    const provider = getJuryProvider(userKeys);
    const response = await provider.generateResponse({
      prompt: extractionPrompt,
      temperature: 0,
      jsonMode: true,
    });

    return parseExtractionResponse(response.content);
  } catch (err) {
    console.error('[Extractor] Failed to extract claims:', err);
    // Return a safe fallback rather than crashing the jury request
    return {
      agreements: ['Multiple models provided responses to this question.'],
      contradictions: [],
      uniqueInsights: [],
    };
  }
}

function parseExtractionResponse(content: string): ExtractionResult {
  try {
    const parsed = tryParseJSON(content);

    return {
      agreements: Array.isArray(parsed.agreements) ? parsed.agreements.slice(0, 5) : [],
      contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions.slice(0, 3) : [],
      uniqueInsights: Array.isArray(parsed.uniqueInsights) ? parsed.uniqueInsights : [],
    };
  } catch {
    console.error('[Extractor] Failed to parse JSON response:', content.slice(0, 200));
    return {
      agreements: [],
      contradictions: [],
      uniqueInsights: [],
    };
  }
}

/**
 * Robust JSON parsing with multiple fallback strategies:
 * 1. Direct parse
 * 2. Strip markdown code fences and parse
 * 3. Extract JSON object from mixed content via regex
 */
function tryParseJSON(content: string): any {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(content.trim());
  } catch { /* continue */ }

  // Strategy 2: Strip markdown code fences
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Strategy 3: Regex extraction — find the first { ... } block
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { /* continue */ }
  }

  throw new Error('Could not parse JSON from response');
}
