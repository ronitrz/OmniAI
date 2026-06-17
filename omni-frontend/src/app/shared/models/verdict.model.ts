export interface Contradiction {
  topic: string;
  positions: Record<string, string>; // modelId -> position text
}

export interface UniqueInsight {
  modelId: string;
  insight: string;
}

export interface JuryVerdict {
  id: string;
  messageId: string;
  consensusText: string;
  confidenceScore: number;
  confidenceLabel: 'HIGH' | 'MEDIUM' | 'LOW';
  agreements: string[];
  contradictions: Contradiction[];
  uniqueInsights: UniqueInsight[];
  recommendation: string;
  createdAt: string;
}
