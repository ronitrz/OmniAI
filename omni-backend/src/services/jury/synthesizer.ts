// src/services/jury/synthesizer.ts
// Generates the final Jury Verdict consensus text and recommendation.
// Sends the original prompt, all responses, and extraction results to Gemini.
// Returns a polished consensus narrative with a clear recommendation.

import { providerRegistry } from '../ai/provider-registry';
import { ExtractionResult, ModelResponseInput } from './extractor';
import { ScoringResult } from './scorer';

export interface SynthesisResult {
  consensusText: string;
  recommendation: string;
}

export async function synthesizeVerdict(
  prompt: string,
  responses: ModelResponseInput[],
  extraction: ExtractionResult,
  scoring: ScoringResult
): Promise<SynthesisResult> {
  const validResponses = responses.filter(r => r.content.trim().length > 50);

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
    const provider = providerRegistry.getProvider('gemini-flash');
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
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

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

function getFallbackVerdict(extraction: ExtractionResult, scoring: ScoringResult): SynthesisResult {
  const agreementSummary = extraction.agreements.length > 0
    ? `The models found common ground on ${extraction.agreements.length} key point(s): ${extraction.agreements[0]}.`
    : 'The models approached this question from different angles.';

  return {
    consensusText: `Based on the analysis of all model responses, ${agreementSummary} The ${scoring.confidenceLabel.toLowerCase()} confidence score of ${Math.round(scoring.confidenceScore * 100)}% reflects the degree of alignment between the models.`,
    recommendation: 'Review the individual model responses above and consider the points of agreement as the most reliable guidance.',
  };
}
