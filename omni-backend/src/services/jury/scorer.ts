// src/services/jury/scorer.ts
// Calculates the confidence score from the extraction result.
// Pure arithmetic — no AI call needed. Transparent and explainable.
//
// Formula:
//   agreementRatio = agreedPoints / max(totalPoints, 5)   [clamped denominator]
//   contradictionPenalty = contradictions.length * 0.08   [each costs 8%]
//   score = agreementRatio - contradictionPenalty
//   score = clamp(score, 0.1, 1.0)

import { ExtractionResult } from './extractor';

export interface ScoringResult {
  confidenceScore: number; // 0.0 – 1.0
  confidenceLabel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function calculateConfidence(extraction: ExtractionResult): ScoringResult {
  const agreementCount = extraction.agreements.length;
  const contradictionCount = extraction.contradictions.length;

  // Agreement ratio: normalize against max of 5 possible agreements
  const maxAgreements = 5;
  const agreementRatio = Math.min(agreementCount / maxAgreements, 1.0);

  // Each contradiction reduces confidence by 8%
  const contradictionPenalty = contradictionCount * 0.08;

  // Raw score
  let score = agreementRatio - contradictionPenalty;

  // Clamp between 0.10 and 1.0
  // Never show 0% — even a single agreement is meaningful
  score = Math.max(0.1, Math.min(1.0, score));

  // Round to 2 decimal places
  const confidenceScore = Math.round(score * 100) / 100;

  return {
    confidenceScore,
    confidenceLabel: getLabel(confidenceScore),
  };
}

function getLabel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 0.70) return 'HIGH';
  if (score >= 0.45) return 'MEDIUM';
  return 'LOW';
}
