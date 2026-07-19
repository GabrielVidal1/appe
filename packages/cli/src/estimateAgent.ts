import {
  AGENT_DEFAULTS,
  AGENT_PRESETS,
  ALL_TEXT_MODELS,
  AgentComplexity,
  AgentPricingResult,
  AgentRunConfig,
  AgentTypology,
  COMPLEXITY_PRESETS,
  Model,
  TYPOLOGY_PRIORS,
  estimateAgentRun,
  formatDuration,
} from "@appe/core";

import { bold, cyan, dim, table, usd } from "./format";

/** Options for `appe estimate-agent`, after arg parsing. */
export type AgentOptions = {
  /** Explicit turn count (wins over typology/complexity/preset). */
  turns?: number;
  typology?: AgentTypology;
  complexity?: AgentComplexity;
  preset?: string;
  toolsPerTurn?: number;
  baseContextTokens?: number;
  contextGrowthPerTurn?: number;
  outputTokensPerTurn?: number;
  cacheHitRate?: number;
  reasoning?: boolean;
  runs?: number;
  /** Compare continuing the current conversation vs starting a fresh one. */
  compareContinue?: boolean;
  /** Tokens already in the current conversation's context (for --continue). */
  existingContextTokens?: number;
  providers: string[];
  tags: string[];
  tiers: string[];
  top: number;
  json: boolean;
};

/** Resolve a config from the shape flags (turns wins, then complexity, then
 *  typology, then preset, else the coding-agent default of 120 turns). */
export function resolveConfig(o: AgentOptions): AgentRunConfig {
  let cfg: AgentRunConfig = { turns: 120 };

  if (o.preset) {
    const p = AGENT_PRESETS.find((x) => x.key === o.preset);
    if (p) cfg = { ...p.config };
  }
  if (o.typology) cfg = { ...cfg, turns: TYPOLOGY_PRIORS[o.typology].medianTurns };
  if (o.complexity) {
    cfg = {
      ...cfg,
      turns: COMPLEXITY_PRESETS[o.complexity].turns,
      toolsPerTurn: COMPLEXITY_PRESETS[o.complexity].toolsPerTurn,
    };
  }
  if (o.turns !== undefined) cfg.turns = o.turns;

  // Explicit overrides win over everything.
  if (o.toolsPerTurn !== undefined) cfg.toolsPerTurn = o.toolsPerTurn;
  if (o.baseContextTokens !== undefined)
    cfg.baseContextTokens = o.baseContextTokens;
  if (o.contextGrowthPerTurn !== undefined)
    cfg.contextGrowthPerTurn = o.contextGrowthPerTurn;
  if (o.outputTokensPerTurn !== undefined)
    cfg.outputTokensPerTurn = o.outputTokensPerTurn;
  if (o.cacheHitRate !== undefined) cfg.cacheHitRate = o.cacheHitRate;
  if (o.reasoning) cfg.reasoning = true;
  if (o.runs !== undefined) cfg.runs = o.runs;

  return cfg;
}

/** Filter the catalogue by the shared provider/tier/tag flags, dropping models
 *  with no output price (same rule as `estimate`). */
function matched(o: AgentOptions): Model[] {
  return ALL_TEXT_MODELS.filter((m) => {
    if (o.providers.length && !o.providers.includes(m.provider)) return false;
    if (o.tiers.length && !o.tiers.includes(m.tier)) return false;
    if (o.tags.length && !m.tags.some((t) => o.tags.includes(t))) return false;
    return m.output_cost > 0;
  });
}

export type AgentRow = { model: Model; result: AgentPricingResult };

/**
 * Continuing a conversation vs starting a new one is the same loop with a
 * different *starting* context. A new conversation begins at the empirical base
 * (~35k tok: system + tools + repo). Continuing begins with everything already
 * in the transcript — so its base context is higher, and every turn re-reads
 * that larger prefix. The per-turn cost is therefore higher for the same N.
 *
 * We model "continue" by raising `baseContextTokens` to the existing context.
 */
export function continueVsNew(cfg: AgentRunConfig, model: Model, existing: number) {
  const base = cfg.baseContextTokens ?? AGENT_DEFAULTS.baseContextTokens;
  const fresh = estimateAgentRun({ ...cfg, baseContextTokens: base }, model);
  const cont = estimateAgentRun(
    { ...cfg, baseContextTokens: Math.max(base, existing) },
    model,
  );
  return { fresh, cont };
}

export function runAgent(o: AgentOptions) {
  const cfg = resolveConfig(o);
  const models = matched(o);
  const rows: AgentRow[] = models
    .map((model) => ({ model, result: estimateAgentRun(cfg, model) }))
    .sort((a, b) => a.result.cost.total - b.result.cost.total);
  return { cfg, rows, candidates: models };
}

// ── rendering ─────────────────────────────────────────────────────────────────

const DRIVER: Record<AgentPricingResult["dominatedBy"], string> = {
  turns: "turn count",
  context: "context growth",
  output: "output length",
};

/** The default model to headline: Opus 4.8 (the corpus), else the first row. */
function headlineModel(rows: AgentRow[]): AgentRow | undefined {
  return (
    rows.find((r) => r.model.id === "anthropic/claude-opus-4-8") ??
    rows.find((r) => /opus/.test(r.model.id)) ??
    rows[0]
  );
}

export function renderAgentTable(o: AgentOptions, r: ReturnType<typeof runAgent>): string {
  const { cfg, rows } = r;
  const head = headlineModel(rows);
  const lines: string[] = [];

  lines.push(
    `${bold("Agentic run")} — ${cfg.turns} turns` +
      (cfg.runs && cfg.runs > 1 ? ` × ${cfg.runs.toLocaleString("en-US")} runs` : "") +
      (cfg.reasoning ? " · reasoning" : ""),
  );

  if (head) {
    const b = head.result.band;
    const speedNote =
      head.model.speed_source === "estimated" ? " est." : "";
    lines.push(
      `${dim("headline")} ${bold(head.model.name)} ${dim(`(${head.model.provider})`)}  ` +
        `${bold(usd(b.p50))} ${dim(`· 80% ${usd(b.p10)}–${usd(b.p90)}`)}  ` +
        `${dim("· ~")}${bold(formatDuration(head.result.durationSeconds))}${dim(
          ` model time${speedNote}`,
        )}  ` +
        `${dim("dominated by")} ${DRIVER[head.result.dominatedBy]}`,
    );
    const t = head.result.tokens;
    const share = (x: number) => `${Math.round((x / (t.total || 1)) * 100)}%`;
    lines.push(
      dim(
        `  tokens: cache-read ${share(t.cacheRead)} · cache-write ${share(
          t.cacheWrite,
        )} · fresh-in ${share(t.inputFresh)} · output ${share(t.output)}  ` +
          `(~${usd(head.result.perTurnCost)}/turn)`,
      ),
    );
  }

  // continue vs new comparison
  if (o.compareContinue && head) {
    const existing = o.existingContextTokens ?? 120_000;
    const { fresh, cont } = continueVsNew(cfg, head.model, existing);
    const newBase = cfg.baseContextTokens ?? AGENT_DEFAULTS.baseContextTokens;
    lines.push("");
    lines.push(bold("Continue this conversation vs start a new one"));
    lines.push(
      dim(
        `  (same ${cfg.turns}-turn task on ${head.model.name}; ` +
          `existing context ≈ ${(existing / 1000).toFixed(0)}k tok)`,
      ),
    );
    lines.push(
      table(
        [
          { label: "New conversation", r: fresh, baseTok: newBase },
          { label: "Continue current", r: cont, baseTok: Math.max(newBase, existing) },
        ],
        [
          { header: "option", value: (x) => x.label },
          { header: "cost", align: "right", value: (x) => usd(x.r.cost.total) },
          {
            header: "per-turn",
            align: "right",
            value: (x) => usd(x.r.perTurnCost),
          },
          {
            header: "base ctx",
            align: "right",
            value: (x) => `${Math.round(x.baseTok / 1000)}k`,
          },
        ],
      ),
    );
    const delta = cont.cost.total - fresh.cost.total;
    const pctMore = fresh.cost.total > 0 ? (delta / fresh.cost.total) * 100 : 0;
    lines.push(
      dim(
        `  Continuing costs ${usd(Math.abs(delta))} ${
          delta >= 0 ? "more" : "less"
        } (${pctMore >= 0 ? "+" : ""}${pctMore.toFixed(0)}%) — the whole ` +
          `transcript is re-read every turn. A fresh session starts lean but ` +
          `loses the loaded context (you re-explain).`,
      ),
    );
  }

  // ranked model table
  lines.push("");
  lines.push(bold(`Cost of this run across ${r.candidates.length} models`));
  const shown = rows.slice(0, o.top);
  lines.push(
    table(shown, [
      { header: "#", align: "right", value: (_row, i) => String(i + 1) },
      { header: "model", max: 32, value: (x) => x.model.name },
      { header: "provider", max: 16, value: (x) => x.model.provider },
      { header: "tier", value: (x) => x.model.tier },
      {
        header: "in/out $/M",
        align: "right",
        value: (x) => `${x.model.input_cost}/${x.model.output_cost}`,
      },
      {
        header: "time",
        align: "right",
        value: (x) =>
          formatDuration(x.result.durationSeconds) +
          (x.model.speed_source === "estimated" ? "*" : ""),
      },
      {
        header: "run cost",
        align: "right",
        value: (x) => cyan(usd(x.result.cost.total)),
      },
    ]),
  );
  lines.push(
    dim(
      "  time = model generation wall-clock (tokens ÷ speed); * = tier-estimated speed",
    ),
  );
  if (r.candidates.length > o.top) {
    lines.push(dim(`  … ${r.candidates.length - o.top} more (use --top N or filter)`));
  }
  return lines.join("\n");
}

export function renderAgentJson(o: AgentOptions, r: ReturnType<typeof runAgent>): string {
  const head = headlineModel(r.rows);
  const compare =
    o.compareContinue && head
      ? (() => {
          const { fresh, cont } = continueVsNew(
            r.cfg,
            head.model,
            o.existingContextTokens ?? 120_000,
          );
          return {
            existingContextTokens: o.existingContextTokens ?? 120_000,
            model: head.model.id,
            new: { cost: fresh.cost.total, perTurn: fresh.perTurnCost },
            continue: { cost: cont.cost.total, perTurn: cont.perTurnCost },
            deltaCost: cont.cost.total - fresh.cost.total,
          };
        })()
      : undefined;

  return JSON.stringify(
    {
      config: r.cfg,
      headline: head
        ? {
            model: head.model.id,
            cost: head.result.cost.total,
            band: head.result.band,
            dominatedBy: head.result.dominatedBy,
            perTurnCost: head.result.perTurnCost,
            tokens: head.result.tokens,
            durationSeconds: head.result.durationSeconds,
            speedSource: head.model.speed_source,
          }
        : null,
      compareContinueVsNew: compare,
      results: r.rows.slice(0, o.top).map((x) => ({
        id: x.model.id,
        provider: x.model.provider,
        name: x.model.name,
        tier: x.model.tier,
        cost: x.result.cost.total,
        band: x.result.band,
        durationSeconds: x.result.durationSeconds,
        speedSource: x.model.speed_source,
      })),
      modelCount: r.candidates.length,
    },
    null,
    2,
  );
}
