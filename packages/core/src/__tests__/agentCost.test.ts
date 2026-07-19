import { describe, expect, it } from "vitest";

import { estimateAgentRun } from "../agentCost";
import { AGENT_POWER_LAW } from "../types/agent";
import { Model } from "../types/model";

/** An Opus-4.8-priced model — the corpus the model was fitted on is ~90% Opus,
 *  so the mechanism must reproduce the power law at *these* rates. */
const opus = (overrides: Partial<Model> = {}): Model => ({
  id: "anthropic/claude-opus-4-8",
  provider: "anthropic",
  name: "Claude Opus 4.8",
  version: "4.8",
  description: "",
  model_size: null,
  input_cost: 5,
  output_cost: 25,
  cache_cost: 0.5,
  input_audio_cost: null,
  max_token: 200000,
  tier: "big",
  tags: ["reasoning", "tools"],
  license: "proprietary",
  speed_tps: 45,
  ttft_s: 0.8,
  speed_source: "estimated",
  ...overrides,
});

describe("estimateAgentRun", () => {
  it("reproduces the empirical power law within the 80% band", () => {
    // cost ≈ a·N^b, and the mechanism must land inside predict × [0.58, 1.72].
    const { a, b } = AGENT_POWER_LAW;
    for (const N of [20, 50, 100, 200]) {
      const predicted = a * Math.pow(N, b);
      const got = estimateAgentRun({ turns: N }, opus()).cost.total;
      expect(got).toBeGreaterThan(predicted * 0.58);
      expect(got).toBeLessThan(predicted * 1.72);
    }
  });

  it("is super-linear in turns (doubling turns more than doubles cost)", () => {
    const c100 = estimateAgentRun({ turns: 100 }, opus()).cost.total;
    const c200 = estimateAgentRun({ turns: 200 }, opus()).cost.total;
    expect(c200).toBeGreaterThan(2 * c100);
  });

  it("is dominated by cache-read tokens", () => {
    const r = estimateAgentRun({ turns: 100 }, opus());
    expect(r.tokens.cacheRead / r.tokens.total).toBeGreaterThan(0.9);
    // …and turn count is the sensitivity driver.
    expect(r.dominatedBy).toBe("turns");
  });

  it("scales linearly with the model's blended rate", () => {
    // Halving every rate must halve the bill.
    const full = estimateAgentRun({ turns: 100 }, opus()).cost.total;
    const half = estimateAgentRun(
      { turns: 100 },
      opus({ input_cost: 2.5, output_cost: 12.5, cache_cost: 0.25 })
    ).cost.total;
    expect(half).toBeCloseTo(full / 2, 5);
  });

  it("multiplies by the run count for batch shapes", () => {
    const one = estimateAgentRun({ turns: 5 }, opus()).cost.total;
    const thousand = estimateAgentRun({ turns: 5, runs: 1000 }, opus())
      .cost.total;
    expect(thousand).toBeCloseTo(one * 1000, 5);
  });

  it("returns an ordered p10 < p50 < p90 band", () => {
    const { band } = estimateAgentRun({ turns: 80 }, opus());
    expect(band.p10).toBeLessThan(band.p50);
    expect(band.p50).toBeLessThan(band.p90);
  });

  it("handles zero turns without dividing by zero", () => {
    const r = estimateAgentRun({ turns: 0 }, opus());
    expect(r.cost.total).toBe(0);
    expect(Number.isFinite(r.perTurnCost)).toBe(true);
  });

  it("estimates wall-clock duration from the model's speed", () => {
    // 100 turns, default 720 output tok/turn = 72_000 output tokens.
    // duration = ttft·turns + output/tps = 0.8·100 + 72000/45 = 80 + 1600 = 1680s.
    const r = estimateAgentRun({ turns: 100 }, opus());
    expect(r.durationSeconds).toBeCloseTo(0.8 * 100 + 72000 / 45, 3);
  });

  it("caps per-turn TTFT so a reasoning model's huge benchmark TTFT can't blow up the loop", () => {
    // A reasoning model with a 30s benchmark TTFT (thinking bundled in). Over
    // 100 turns the uncapped latency term would be 3000s; the cap holds it to
    // 3s/turn = 300s, so generation time (72000/45 = 1600s) dominates instead.
    const r = estimateAgentRun({ turns: 100 }, opus({ ttft_s: 30 }));
    expect(r.durationSeconds).toBeCloseTo(3 * 100 + 72000 / 45, 3);
  });

  it("a faster model finishes the same run in less wall-clock", () => {
    const slow = estimateAgentRun({ turns: 100 }, opus()); // 45 tps
    const fast = estimateAgentRun(
      { turns: 100 },
      opus({ speed_tps: 150, ttft_s: 0.3 })
    );
    expect(fast.durationSeconds).toBeLessThan(slow.durationSeconds);
  });
});
