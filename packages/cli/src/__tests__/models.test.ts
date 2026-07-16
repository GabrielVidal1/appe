import { describe, expect, it } from "vitest";

import { ALL_TEXT_MODELS } from "@appe/core";

import { runModels, type ModelsOptions } from "../models";

const options = (over: Partial<ModelsOptions> = {}): ModelsOptions => ({
  query: "",
  providers: [],
  tags: [],
  tiers: [],
  maxCost: undefined,
  sort: "cost",
  top: 30,
  json: false,
  ...over,
});

describe("runModels", () => {
  it("returns the whole text catalogue with no filters", () => {
    const { rows, total } = runModels(options());
    expect(total).toBe(ALL_TEXT_MODELS.length);
    expect(rows.length).toBe(ALL_TEXT_MODELS.length);
  });

  it("filters by provider, tier and tag (any-of)", () => {
    const byProvider = runModels(options({ providers: ["anthropic", "openai"] }));
    expect(byProvider.rows.length).toBeGreaterThan(0);
    expect(
      byProvider.rows.every((m) => ["anthropic", "openai"].includes(m.provider))
    ).toBe(true);

    const bySmall = runModels(options({ tiers: ["small"] }));
    expect(bySmall.rows.every((m) => m.tier === "small")).toBe(true);

    const byTag = runModels(options({ tags: ["reasoning"] }));
    expect(byTag.rows.length).toBeGreaterThan(0);
    expect(byTag.rows.every((m) => m.tags.includes("reasoning"))).toBe(true);
  });

  it("caps both input and output rates with --max-cost", () => {
    const { rows } = runModels(options({ maxCost: 1 }));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((m) => m.input_cost <= 1 && m.output_cost <= 1)).toBe(true);
    // A model dear on either side must be excluded.
    expect(rows.some((m) => m.input_cost > 1 || m.output_cost > 1)).toBe(false);
  });

  it("matches the query against name / id / provider, all words required", () => {
    const { rows } = runModels(options({ query: "claude haiku" }));
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((m) => {
        const hay = `${m.name} ${m.id} ${m.provider}`.toLowerCase();
        return hay.includes("claude") && hay.includes("haiku");
      })
    ).toBe(true);

    // A word that appears in no model rules the whole row out.
    expect(runModels(options({ query: "claude zzznope" })).rows).toHaveLength(0);
  });

  it("sorts by the chosen key", () => {
    const byOutput = runModels(options({ sort: "output" })).rows.map((m) => m.output_cost);
    expect(byOutput).toEqual([...byOutput].sort((a, b) => a - b));

    const byInput = runModels(options({ sort: "input" })).rows.map((m) => m.input_cost);
    expect(byInput).toEqual([...byInput].sort((a, b) => a - b));

    // Context: biggest window first, a null window last.
    const ctx = runModels(options({ sort: "context" })).rows.map((m) => m.max_token ?? -1);
    expect(ctx).toEqual([...ctx].sort((a, b) => b - a));

    const names = runModels(options({ sort: "name" })).rows.map((m) => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("combines filters (cheap reasoners)", () => {
    const { rows } = runModels(options({ tags: ["reasoning"], maxCost: 1 }));
    expect(
      rows.every((m) => m.tags.includes("reasoning") && Math.max(m.input_cost, m.output_cost) <= 1)
    ).toBe(true);
  });
});
