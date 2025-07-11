
import { Model } from './types';
import modelsData from '../data.json';

// Type assertion to ensure data matches our Model type
const models: Model[] = modelsData as Model[];

export interface PricingResult {
  model: Model;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface ComputationParams {
  dataCount: number;
  inputTokensPerItem: number;
  outputTokensPerItem: number;
}

// Estimate tokens based on data type and prompt
export const estimateTokens = (dataType: string, prompt: string, examples: string[]): { input: number; output: number } => {
  // Base tokens for different data types
  const dataTypeTokens = {
    images: 300, // Images typically require more tokens for vision processing
    files: 150,  // Text files
    pdfs: 200    // PDFs might have mixed content
  };

  // Estimate input tokens: prompt + data type processing
  const promptTokens = Math.ceil(prompt.length / 4); // Rough estimation: ~4 chars per token
  const baseDataTokens = dataTypeTokens[dataType as keyof typeof dataTypeTokens] || 150;
  const inputTokensPerItem = promptTokens + baseDataTokens;

  // Estimate output tokens based on examples
  const exampleTokens = examples.map(ex => Math.ceil(ex.length / 4));
  const avgExampleTokens = exampleTokens.length > 0 
    ? exampleTokens.reduce((sum, tokens) => sum + tokens, 0) / exampleTokens.length 
    : 100; // Default if no examples
  
  const outputTokensPerItem = Math.max(50, avgExampleTokens); // Minimum 50 tokens output

  return {
    input: inputTokensPerItem,
    output: outputTokensPerItem
  };
};

export const calculatePricing = (params: ComputationParams): PricingResult[] => {
  return models.map(model => {
    // Convert costs from per million tokens to per token
    const inputCostPerToken = model.input_cost / 1000000;
    const outputCostPerToken = model.output_cost / 1000000;

    // Calculate total costs
    const totalInputTokens = params.dataCount * params.inputTokensPerItem;
    const totalOutputTokens = params.dataCount * params.outputTokensPerItem;

    const inputCost = totalInputTokens * inputCostPerToken;
    const outputCost = totalOutputTokens * outputCostPerToken;
    const totalCost = inputCost + outputCost;

    return {
      model,
      inputCost,
      outputCost,
      totalCost
    };
  });
};

// Group models by provider for table display
export const groupModelsByProvider = (results: PricingResult[]) => {
  const grouped: { [provider: string]: PricingResult[] } = {};
  
  results.forEach(result => {
    if (!grouped[result.model.provider]) {
      grouped[result.model.provider] = [];
    }
    grouped[result.model.provider].push(result);
  });

  return grouped;
};

// Find the best value option
export const findBestValue = (results: PricingResult[]): PricingResult => {
  return results.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );
};
