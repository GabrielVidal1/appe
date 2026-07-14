import { describe, expect, it } from "vitest";

import {
  ALL_MODELS,
  ALL_MODELS_BY_ID,
  ALL_PROVIDERS,
  ALL_TEXT_MODELS,
  MODELS_META,
} from "../data";

// The catalogue is regenerated daily by scripts/sync-models.mjs, so these are
// deliberately shape/invariant checks, not assertions about specific models or
// prices — they must not start failing because models.dev shipped a new model.
describe("model catalogue", () => {
  it("is non-empty", () => {
    expect(ALL_MODELS.length).toBeGreaterThan(0);
  });

  it("gives every model the fields the estimator reads", () => {
    for (const model of ALL_MODELS) {
      expect(typeof model.id).toBe("string");
      expect(model.id.length).toBeGreaterThan(0);
      expect(typeof model.provider).toBe("string");
      expect(Number.isFinite(model.input_cost)).toBe(true);
      expect(Number.isFinite(model.output_cost)).toBe(true);
      expect(["small", "medium", "big"]).toContain(model.tier);
    }
  });

  it("keys models by a unique id", () => {
    expect(Object.keys(ALL_MODELS_BY_ID).length).toBe(ALL_MODELS.length);
  });

  it("derives text models as a subset of all models", () => {
    expect(ALL_TEXT_MODELS.length).toBeGreaterThan(0);
    expect(ALL_TEXT_MODELS.length).toBeLessThanOrEqual(ALL_MODELS.length);
    expect(ALL_TEXT_MODELS.every((m) => m.task?.includes("text"))).toBe(true);
  });

  it("derives a sorted, unique provider list", () => {
    expect(ALL_PROVIDERS.length).toBeGreaterThan(0);
    expect(new Set(ALL_PROVIDERS).size).toBe(ALL_PROVIDERS.length);
    expect([...ALL_PROVIDERS].sort()).toEqual(ALL_PROVIDERS);
  });

  it("records where the catalogue came from", () => {
    expect(MODELS_META.source).toContain("models.dev");
    expect(Number.isNaN(Date.parse(MODELS_META.generatedAt))).toBe(false);
  });
});
