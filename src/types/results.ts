import { Model } from "./model";

export type TokenResults = {
  model: Model;
  inputTokens: {
    text: number;
    document: number;
    image: number;
    total: number;
  };
  outputTokens: number;
  totalTokens: number;
};

export type PricingResult = TokenResults & {
  inputCost: {
    text: number;
    document: number;
    image: number;
    total: number;
  };
  cachedCost?: number;
  outputCost: number;
  totalCost: number;
};
