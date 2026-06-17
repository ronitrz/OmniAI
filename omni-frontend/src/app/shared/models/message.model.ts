export interface ModelResponse {
  id: string;
  messageId: string;
  modelId: string;
  modelName: string;
  content: string;
  isMock: boolean;
  status: 'success' | 'error' | 'timeout';
  latencyMs?: number;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  selectedModels: string[];
  mode: 'standard' | 'research';
  sessionId: string;
  createdAt: string;
  responses?: ModelResponse[];
  juryVerdict?: any; // To avoid circular imports or complex referencing, we can use any or import JuryVerdict
}
