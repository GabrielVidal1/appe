import { describe, expect, it } from "vitest";

import {
  estimateDuration,
  modelSpeed,
  formatDuration,
  TIER_FALLBACK_TPS,
  TIER_FALLBACK_TTFT,
} from "../speed";
import { Model } from "../types/model";

const model = (overrides: Partial<Model> = {}): Model => ({
  id: "test/model",
  provider: "openai",
  name: "Test Model",
  version: "1",
  description: "",
  model_size: null,
  input_cost: 1,
  output_cost: 10,
  cache_cost: null,
  input_audio_cost: null,
  max_token: 100_000,
  tier: "medium",
  tags: [],
  license: "commercial",
  speed_tps: 100,
  ttft_s: 0.5,
  speed_source: "measured",
  ...overrides,
});

describe("modelSpeed", () => {
  it("uses measured speed when present", () => {
    expect(modelSpeed(model({ speed_tps: 200, ttft_s: 0.2 }))).toEqual({
      tps: 200,
      ttft: 0.2,
    });
  });

  it("falls back to tier speed when speed_tps is missing", () => {
    const s = modelSpeed(model({ tier: "small", speed_tps: null, ttft_s: null }));
    expect(s.tps).toBe(TIER_FALLBACK_TPS.small);
    expect(s.ttft).toBe(TIER_FALLBACK_TTFT.small);
  });

  it("falls back to tier speed when speed_tps is zero/negative", () => {
    expect(modelSpeed(model({ tier: "big", speed_tps: 0 })).tps).toBe(
      TIER_FALLBACK_TPS.big
    );
  });
});

describe("estimateDuration", () => {
  it("is ttft + outputTokens / tps for one request", () => {
    // 1000 tokens at 100 tps = 10s, plus 0.5s ttft = 10.5s
    expect(estimateDuration(model(), 1000)).toBeCloseTo(10.5, 5);
  });

  it("multiplies by count for sequential requests", () => {
    expect(estimateDuration(model(), 1000, 3)).toBeCloseTo(31.5, 5);
  });

  it("smaller/faster models take less time for the same output", () => {
    const big = estimateDuration(model({ tier: "big", speed_tps: 45 }), 5000);
    const small = estimateDuration(
      model({ tier: "small", speed_tps: 120 }),
      5000
    );
    expect(small).toBeLessThan(big);
  });

  it("never returns negative time for empty/negative output", () => {
    expect(estimateDuration(model(), 0)).toBeCloseTo(0.5, 5); // just the ttft
    expect(estimateDuration(model(), -100)).toBeCloseTo(0.5, 5);
  });
});

describe("formatDuration", () => {
  it("formats sub-10s with one decimal", () => {
    expect(formatDuration(3.24)).toBe("3.2s");
  });
  it("rounds 10–60s to whole seconds", () => {
    expect(formatDuration(42.6)).toBe("43s");
  });
  it("formats minutes and seconds", () => {
    expect(formatDuration(80)).toBe("1m 20s");
    expect(formatDuration(120)).toBe("2m");
  });
  it("formats hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3660)).toBe("1h 1m");
  });
  it("guards against invalid input", () => {
    expect(formatDuration(-1)).toBe("—");
    expect(formatDuration(Infinity)).toBe("—");
  });
});
