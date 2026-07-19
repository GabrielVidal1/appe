import { Model } from "./model";

export type TokenResults = {
  model: Model;
  inputTokens: {
    text: number;
    document: number;
    image: number;
    audio: number;
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
    audio: number;
    total: number;
  };
  cachedCost?: number;
  outputCost: number;
  totalCost: number;
  /**
   * Estimated wall-clock time (seconds) for ONE request: time-to-first-token +
   * output tokens ÷ the model's tokens/sec. This is per item, not × dataCount —
   * with batching the requests run in parallel, so the sum would be misleading;
   * the UI shows per-item time and notes that N items run concurrently in batch.
   * Uses measured speed when available, else a tier fallback (model.speed_source).
   */
  durationSeconds: number;
};
