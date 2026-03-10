
import { ModelPricing, Provider } from './types';

export const MODELS: ModelPricing[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: Provider.OPENAI, inputPricePer1M: 2.50, outputPricePer1M: 10.00 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: Provider.OPENAI, inputPricePer1M: 0.15, outputPricePer1M: 0.60 },
  { id: 'o1-preview', name: 'o1 Preview', provider: Provider.OPENAI, inputPricePer1M: 15.00, outputPricePer1M: 60.00 },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: Provider.ANTHROPIC, inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: Provider.ANTHROPIC, inputPricePer1M: 0.25, outputPricePer1M: 1.25 },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: Provider.GOOGLE, inputPricePer1M: 0.10, outputPricePer1M: 0.40 },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', provider: Provider.GOOGLE, inputPricePer1M: 1.25, outputPricePer1M: 5.00 },
  { id: 'llama-3-3-70b', name: 'Llama 3.3 70B', provider: Provider.META, inputPricePer1M: 0.60, outputPricePer1M: 1.80 },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: Provider.MISTRAL, inputPricePer1M: 0.14, outputPricePer1M: 0.28 }
];

export const INITIAL_DATA: string = JSON.stringify([
  {
    id: '1',
    timestamp: Date.now() - 86400000 * 2,
    modelId: 'gpt-4o',
    inputTokens: 12400,
    outputTokens: 4200,
    cost: (12400 * 2.5 / 1000000) + (4200 * 10 / 1000000),
    project: 'E-commerce Bot',
    agentName: 'OrderProcessor',
    purpose: 'Refactoring checkout logic'
  },
  {
    id: '2',
    timestamp: Date.now() - 86400000 * 1.5,
    modelId: 'claude-3-5-sonnet',
    inputTokens: 45000,
    outputTokens: 8500,
    cost: (45000 * 3 / 1000000) + (8500 * 15 / 1000000),
    project: 'Research Tool',
    agentName: 'Summarizer-Alpha',
    purpose: 'Deep PDF Analysis'
  },
  {
    id: '3',
    timestamp: Date.now() - 86400000 * 0.5,
    modelId: 'gemini-2.0-flash',
    inputTokens: 150000,
    outputTokens: 12000,
    cost: (150000 * 0.1 / 1000000) + (12000 * 0.4 / 1000000),
    project: 'E-commerce Bot',
    agentName: 'ImageLabeler',
    purpose: 'Bulk catalog tagging'
  }
]);
