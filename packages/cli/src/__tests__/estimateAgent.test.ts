import { describe, expect, it } from "vitest";

import { estimateAgentRun, TYPOLOGY_PRIORS } from "@appe/core";

import {
  continueVsNew,
  resolveConfig,
  runAgent,
  type AgentOptions,
} from "../estimateAgent";

const base: AgentOptions = {
  providers: [],
  tags: [],
  tiers: [],
  top: 15,
  json: false,
};

describe("resolveConfig", () => {
  it("maps a typology to its empirical median turn count", () => {
    expect(resolveConfig({ ...base, typology: "research" }).turns).toBe(
      TYPOLOGY_PRIORS.research.medianTurns,
    );
  });

  it("lets an explicit --turns win over the typology", () => {
    const cfg = resolveConfig({ ...base, typology: "research", turns: 42 });
    expect(cfg.turns).toBe(42);
  });

  it("applies advanced overrides", () => {
    const cfg = resolveConfig({ ...base, turns: 10, cacheHitRate: 0.5, runs: 3 });
    expect(cfg.cacheHitRate).toBe(0.5);
    expect(cfg.runs).toBe(3);
  });
});

describe("runAgent", () => {
  it("ranks models cheapest-first and matches the core estimator", () => {
    const r = runAgent({ ...base, turns: 100, providers: ["anthropic"] });
    expect(r.rows.length).toBeGreaterThan(0);
    // cheapest first
    for (let i = 1; i < r.rows.length; i++) {
      expect(r.rows[i].result.cost.total).toBeGreaterThanOrEqual(
        r.rows[i - 1].result.cost.total,
      );
    }
    // the CLI number IS the core number (never drift)
    const row = r.rows[0];
    expect(row.result.cost.total).toBeCloseTo(
      estimateAgentRun(r.cfg, row.model).cost.total,
      6,
    );
  });
});

describe("continueVsNew", () => {
  it("makes continuing an existing conversation cost more than a fresh one", () => {
    const opus = runAgent({ ...base, turns: 100, providers: ["anthropic"] }).rows.find(
      (r) => r.model.id === "anthropic/claude-opus-4-8",
    )!;
    const cfg = { turns: 100 };
    const { fresh, cont } = continueVsNew(cfg, opus.model, 120_000);
    expect(cont.cost.total).toBeGreaterThan(fresh.cost.total);
  });

  it("is a no-op when the existing context is below the base", () => {
    const opus = runAgent({ ...base, turns: 50, providers: ["anthropic"] }).rows.find(
      (r) => r.model.id === "anthropic/claude-opus-4-8",
    )!;
    const { fresh, cont } = continueVsNew({ turns: 50 }, opus.model, 1_000);
    expect(cont.cost.total).toBeCloseTo(fresh.cost.total, 6);
  });
});
