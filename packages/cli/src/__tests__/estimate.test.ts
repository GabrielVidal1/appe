import { describe, expect, it } from "vitest";

import {
  ALL_TEXT_MODELS,
  DEFAULT_APP_DATA,
  computePrices,
  computeTokens,
  type AppData,
} from "@appe/core";

import { ASSUMED_OUTPUT_TOKENS, runEstimate, type EstimateOptions } from "../estimate";

const options = (over: Partial<EstimateOptions> = {}): EstimateOptions => ({
  task: "summarise a customer support ticket into two sentences",
  count: 10000,
  outputTokens: ASSUMED_OUTPUT_TOKENS,
  outputAssumed: true,
  providers: [],
  tags: [],
  tiers: [],
  top: 20,
  batch: false,
  includeFree: false,
  json: false,
  ...over,
});

const rowFor = (o: EstimateOptions, name: string) =>
  runEstimate(o).rows.find((r) => r.model.name === name);

describe("runEstimate", () => {
  it("ranks cheapest first", () => {
    const { rows } = runEstimate(options());
    const costs = rows.map((r) => r.totalCost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    expect(rows.length).toBeGreaterThan(100);
  });

  it("does not drift from the web app's computation for the same inputs", () => {
    // The web app builds an AppData and calls computeTokens + computePrices.
    // The CLI must produce byte-identical numbers — that is the entire reason
    // the estimator lives in @appe/core rather than in either consumer.
    const o = options({ providers: ["anthropic"] });
    const model = ALL_TEXT_MODELS.find(
      (m) => m.provider === "anthropic" && m.name === "Claude Haiku 4.5"
    );
    expect(model).toBeDefined();

    const appData: AppData = {
      ...DEFAULT_APP_DATA,
      dataType: "prompts",
      prompt: o.task,
      example: "",
      dataCount: o.count,
      batchEnabled: false,
      selectedModels: [],
    };
    const tokens = computeTokens(appData, model!);
    const expected = computePrices(appData, model!, {
      ...tokens,
      outputTokens: ASSUMED_OUTPUT_TOKENS,
      totalTokens: tokens.inputTokens.total + ASSUMED_OUTPUT_TOKENS,
    });

    const row = rowFor(o, "Claude Haiku 4.5");
    expect(row!.totalCost).toBe(expected.totalCost);
    expect(row!.outputCost).toBe(expected.outputCost);
    expect(row!.inputTokens.total).toBe(expected.inputTokens.total);
    // 14 input tokens × $1/Mtok × 10k + 500 output × $5/Mtok × 10k
    expect(row!.totalCost).toBeCloseTo(25.14, 10);
  });

  it("applies the provider's batch discount", () => {
    const plain = rowFor(options({ providers: ["anthropic"] }), "Claude Haiku 4.5");
    const batched = rowFor(
      options({ providers: ["anthropic"], batch: true }),
      "Claude Haiku 4.5"
    );
    // Anthropic's batch API is half price.
    expect(batched!.totalCost).toBeCloseTo(plain!.totalCost * 0.5, 10);
  });

  it("honours an explicit output-token count", () => {
    const { rows } = runEstimate(options({ outputTokens: 42, outputAssumed: false }));
    expect(rows[0].outputTokens).toBe(42);
  });

  it("tokenizes an output sample when no explicit count is given", () => {
    const { rows } = runEstimate(
      options({
        outputTokens: undefined,
        outputAssumed: false,
        outputSample: "Customer cannot log in. Password reset link never arrived.",
      })
    );
    expect(rows[0].outputTokens).toBeGreaterThan(0);
    expect(rows[0].outputTokens).toBeLessThan(ASSUMED_OUTPUT_TOKENS);
  });

  it("hides models with no output price (embedders, free tiers) unless asked", () => {
    const hidden = runEstimate(options());
    expect(hidden.rows.every((r) => r.model.output_cost > 0)).toBe(true);
    expect(hidden.hiddenFree).toBeGreaterThan(0);

    const shown = runEstimate(options({ includeFree: true }));
    expect(shown.rows.some((r) => r.model.output_cost === 0)).toBe(true);
    expect(shown.hiddenFree).toBe(0);
    expect(shown.rows.length).toBeGreaterThan(hidden.rows.length);
  });

  it("filters by provider, tier and tag", () => {
    const byProvider = runEstimate(options({ providers: ["openai", "anthropic"] }));
    expect(byProvider.rows.length).toBeGreaterThan(0);
    expect(
      byProvider.rows.every((r) => ["openai", "anthropic"].includes(r.model.provider))
    ).toBe(true);

    const byTier = runEstimate(options({ tiers: ["small"] }));
    expect(byTier.rows.every((r) => r.model.tier === "small")).toBe(true);

    // Same semantics as the web app: a model matches if it has ANY of the tags.
    const byTag = runEstimate(options({ tags: ["reasoning"] }));
    expect(byTag.rows.length).toBeGreaterThan(0);
    expect(byTag.rows.every((r) => r.model.tags.includes("reasoning"))).toBe(true);
  });

  it("scales linearly with --count", () => {
    const one = rowFor(options({ count: 1, providers: ["anthropic"] }), "Claude Haiku 4.5");
    const many = rowFor(
      options({ count: 1000, providers: ["anthropic"] }),
      "Claude Haiku 4.5"
    );
    expect(many!.totalCost).toBeCloseTo(one!.totalCost * 1000, 8);
  });

  it("returns no rows for an impossible filter combination", () => {
    const { rows } = runEstimate(options({ providers: ["anthropic"], tags: ["video"] }));
    expect(rows).toHaveLength(0);
  });
});
