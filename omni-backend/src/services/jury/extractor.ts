// src/services/jury/extractor.ts
// Extracts structured claims from all model responses using a fast, cheap AI call.
// Sends all responses to Gemini Flash with a JSON schema prompt.
// Returns structured agreements, contradictions, and unique insights.

import { providerRegistry } from '../ai/provider-registry';

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

export async function extractClaims(
  prompt: string,
  responses: ModelResponseInput[]
): Promise<ExtractionResult> {
  // Filter out error responses — only process successful ones
  const validResponses = responses.filter(r => r.content.trim().length > 50);

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
    // Use Gemini (free) for extraction — cheap and fast
    const provider = providerRegistry.getProvider('gemini-flash');
    const response = await provider.generateResponse({
      prompt: extractionPrompt,
      temperature: 0, // Deterministic output for JSON parsing
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
    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

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
