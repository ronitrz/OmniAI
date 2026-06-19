// src/services/jury/synthesizer.ts
// Generates the final Jury Verdict consensus text and recommendation.
// Uses a provider fallback chain: gemini → openai → deepseek → claude.
// Returns a polished consensus narrative with a clear recommendation.

import { providerRegistry } from '../ai/provider-registry';
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
function getJuryProvider(): AIProvider {
  for (const modelId of JURY_PROVIDER_CHAIN) {
    try {
      return providerRegistry.getProvider(modelId);
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
  scoring: ScoringResult
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

  const synthesisPrompt = `You are an expert consensus synthesizer for a Multi-AI platform called OmniAI.

ORIGINAL QUESTION: ${prompt}

AI MODEL RESPONSES (summarized):
${formattedResponses}

ANALYSIS RESULTS:
- Confidence Score: ${Math.round(scoring.confidenceScore * 100)}% (${scoring.confidenceLabel} agreement)
- Key Agreements Identified:
${agreementsList}
- Contradictions Identified:
${contradictionsList}

Generate a Jury Verdict with exactly two parts:

1. CONSENSUS TEXT (2-3 paragraphs):
Write an authoritative, balanced consensus answer representing the strongest agreed-upon position.
Acknowledge areas of disagreement honestly.
Do not hedge excessively — be direct and useful.
Write from the perspective of an informed expert synthesizing multiple AI perspectives.

2. RECOMMENDATION (1-2 sentences):
One clear, actionable recommendation for the user based on the consensus.
Start with an action verb. Example: "Use React for...", "Consider starting with...", "Focus on..."

Format your response as JSON:
{
  "consensusText": "Your 2-3 paragraph consensus here...",
  "recommendation": "Your single recommendation sentence here..."
}

Return ONLY valid JSON. No markdown fences.`;

  try {
    const provider = getJuryProvider();
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
