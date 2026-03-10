
export enum Provider {
  OPENAI = 'OpenAI',
  ANTHROPIC = 'Anthropic',
  GOOGLE = 'Google',
  META = 'Meta',
  MISTRAL = 'Mistral',
  LOCAL = 'Local/Ollama'
}

export interface ModelPricing {
  id: string;
  name: string;
  provider: Provider;
  inputPricePer1M: number;
  outputPricePer1M: number;
}

export interface UsageEntry {
  id: string;
  timestamp: number;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  purpose: string;
  project?: string;
  agentName?: string;
  rawSource?: string;
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  modelBreakdown: Record<string, number>;
  projectBreakdown: Record<string, number>;
}
