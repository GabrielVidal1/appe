import modelsData from "../data/models.json";
import { computeImagePrice } from "./imageCost";
import { Model } from "./types";

// Type assertion to ensure data matches our Model type
export const ALL_MODELS: Model[] = modelsData as Model[];

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
export const estimateTokens = (
  dataType: string,
  prompt: string,
  output: string,
  imageSize?: { width: number; height: number }
): { input: number; output: number } => {
  // Estimate input tokens: prompt + data type processing
  const promptTokens = Math.ceil(prompt.length / 4); // Rough estimation: ~4 chars per token

  let inputTokensPerItem = promptTokens;

  // For images, add the image tokens based on size
  if (dataType === "images" && imageSize) {
    // Calculate average image tokens across providers (using Claude as baseline)
    const imageTokens = computeImagePrice(
      "claude",
      imageSize.width,
      imageSize.height
    ).tokens;
    inputTokensPerItem += Math.ceil(imageTokens);
  }

  // Estimate output tokens based on examples
  const outputTokens = Math.ceil(output.length / 4);

  return {
    input: inputTokensPerItem,
    output: outputTokens,
  };
};

export const calculatePricing = (
  models: Model[],
  params: ComputationParams
): PricingResult[] => {
  return models.map((model) => {
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
      totalCost,
    };
  });
};

// Group models by provider for table display
export const groupModelsByProvider = (results: PricingResult[]) => {
  const grouped: { [provider: string]: PricingResult[] } = {};

  results.forEach((result) => {
    if (!grouped[result.model.provider]) {
      grouped[result.model.provider] = [];
    }
    grouped[result.model.provider].push(result);
  });

  return grouped;
};

// Find the best value option
export const findBestValue = (results: PricingResult[]): PricingResult => {
  return results.reduce(
    (best, current) => (current.totalCost < best.totalCost ? current : best),
    results[0]
  );
};
