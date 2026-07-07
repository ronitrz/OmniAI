// src/services/jury/synthesizer.ts
// Generates the final Jury Verdict consensus text and recommendation.
// Uses a provider fallback chain: gemini → openai → deepseek → claude.
// Returns a polished consensus narrative with a clear recommendation.

import { providerRegistry, UserKeys } from '../ai/provider-registry';
import { AIProvider } from '../ai/interfaces/ai-provider.interface';
import { ExtractionResult, ModelResponseInput } from './extractor';
import { ScoringResult } from './scorer';

export interface SynthesisResult {
  consensusText: string;
  recommendation: string;
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
  throw new Error('No AI provider available for jury synthesis');
}

export async function synthesizeVerdict(
  prompt: string,
  responses: ModelResponseInput[],
  extraction: ExtractionResult,
  scoring: ScoringResult,
  userKeys?: UserKeys
): Promise<SynthesisResult> {
  const validResponses = responses.filter(r => r.content.trim().length > 2);

  if (validResponses.length === 0) {
    return {
      consensusText: 'No successful model responses were available for consensus generation.',
      recommendation: 'Please try your query again with at least one active model.',
    };
  }

  const formattedResponses = validResponses
    .map(r => `**${r.modelName}**: ${r.content.slice(0, 800)}...`)
    .join('\n\n');

  const agreementsList = extraction.agreements.length > 0
    ? extraction.agreements.map(a => `• ${a}`).join('\n')
    : '• No clear agreements were detected between models.';

  const contradictionsList = extraction.contradictions.length > 0
    ? extraction.contradictions.map(c => `• ${c.topic}`).join('\n')
    : '• No significant contradictions were detected.';

  const synthesisPrompt = `You are an expert AI consensus synthesizer for OmniAI, a multi-model AI platform.

ORIGINAL QUESTION: ${prompt}

AI MODEL RESPONSES:
${formattedResponses}

ANALYSIS:
- Confidence Score: ${Math.round(scoring.confidenceScore * 100)}% (${scoring.confidenceLabel} agreement)
- Agreed Points: ${extraction.agreements.length}
- Contradictions: ${extraction.contradictions.length}

Your task: Write a COMPREHENSIVE, AUTHORITATIVE ANSWER to the user's question by synthesizing the best insights from all models.

CRITICAL RULES:
1. Write a DIRECT, COMPLETE ANSWER to the question — NOT a summary of what the models said
2. Use the combined knowledge from all models to produce the richest possible answer
3. Structure with markdown: use **bold** for key terms, ## headers for sections, bullet lists where useful
4. Write 3-5 paragraphs of substantial content (aim for 300-600 words for the consensus text)
5. Where models agreed, state the fact confidently. Where they differed, present both perspectives
6. Never say "the models agreed" or "GPT said" — write directly as if you ARE the expert answer
7. End with a clear, actionable takeaway

Also provide a one-sentence RECOMMENDATION starting with an action verb.

Return as JSON (no markdown fences):
{
  "consensusText": "Your full comprehensive answer here with markdown formatting...",
  "recommendation": "One actionable sentence starting with a verb..."
}

Return ONLY valid JSON.`;

  try {
    const provider = getJuryProvider(userKeys);
    const response = await provider.generateResponse({
      prompt: synthesisPrompt,
      temperature: 0.3, // Slightly creative but mostly deterministic
    });

    return parseSynthesisResponse(response.content);
  } catch (err) {
    console.error('[Synthesizer] Failed to generate verdict:', err);
    return getFallbackVerdict(extraction, scoring);
  }
}

function parseSynthesisResponse(content: string): SynthesisResult {
  try {
    const parsed = tryParseJSON(content);

    if (!parsed.consensusText || !parsed.recommendation) {
      throw new Error('Missing required fields');
    }

    return {
      consensusText: parsed.consensusText,
      recommendation: parsed.recommendation,
    };
  } catch {
    console.error('[Synthesizer] Failed to parse synthesis JSON:', content.slice(0, 200));
    return {
      consensusText: content.slice(0, 1000), // Use raw content as fallback
      recommendation: 'Review the individual model responses above for specific guidance.',
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

function getFallbackVerdict(extraction: ExtractionResult, scoring: ScoringResult): SynthesisResult {
  const agreementSummary = extraction.agreements.length > 0
    ? `The models found common ground on ${extraction.agreements.length} key point(s): ${extraction.agreements[0]}.`
    : 'The models approached this question from different angles.';

  return {
    consensusText: `Based on the analysis of all model responses, ${agreementSummary} The ${scoring.confidenceLabel.toLowerCase()} confidence score of ${Math.round(scoring.confidenceScore * 100)}% reflects the degree of alignment between the models.`,
    recommendation: 'Review the individual model responses above and consider the points of agreement as the most reliable guidance.',
  };
}
