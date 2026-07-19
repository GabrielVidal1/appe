import { ModelSize, Provider } from "./model";
import { PricingResult } from "./results";

/**
 * Agentic estimation — types.
 *
 * An *agent run* is a loop: N turns, each re-reading a growing context prefix
 * as a cache-read, appending a small delta, emitting a little output. That is a
 * different cost shape from "input + output × count", and the parameters here
 * are fitted to 544 real Claude Code runs (see `doc/agentic/PLAN.md`).
 *
 * The headline empirical law is super-linear in turns:
 *   cost ≈ 0.033 · N^1.20   (Opus-4.8 rates, R²≈0.90)
 * because cache-read is ~96% of tokens and the prefix grows every turn. This
 * module models the *mechanism* that produces that law, so swapping the model
 * simply re-scales the bill at that model's real rates.
 */

export type AgentTypology =
  | "feature"
  | "bugfix"
  | "refactor"
  | "research"
  | "chore"
  | "deploy";

export type AgentComplexity = "simple" | "moderate" | "complex";

/** How the user describes an agent run. Only `turns` is required; presets and
 *  the empirical defaults fill the rest. */
export type AgentRunConfig = {
  /** N — the number of AI messages / turns. The dominant cost lever. */
  turns: number;
  /** Tool calls per turn (informational; median 0.49). Default 0.5. */
  toolsPerTurn?: number;
  /** Working set loaded up front (system + tools + repo). Default 35_300 tok. */
  baseContextTokens?: number;
  /** Tokens appended to the transcript each turn. Default 680 tok. */
  contextGrowthPerTurn?: number;
  /** Output (assistant) tokens per turn. Default 720 tok. */
  outputTokensPerTurn?: number;
  /** Share of the prefix served as a cache-read (vs a fresh read). Default 0.96. */
  cacheHitRate?: number;
  /** Reasoning models bill thinking tokens as output — inflate output/turn. */
  reasoning?: boolean;
  /** Repeat the whole run this many times (batch of identical agent runs). */
  runs?: number;
};

/** Empirically-fitted prior for a typology, from the corpus. Used to seed a
 *  config when the user picks a typology, and to show a reference band. */
export type TypologyPrior = {
  label: string;
  /** Median AI-message count for this shape. */
  medianTurns: number;
  /** Median run cost ($) observed, at Opus-4.8 rates. */
  medianCost: number;
  /** ln($) mean and sd — band = exp(mu ± 1.28·sigma) for p10–p90. */
  costMu: number;
  costSigma: number;
  /** n conversations behind the fit (honesty about sample size). */
  n: number;
  /** One-line character of the shape. */
  note: string;
};

/** Empirically-fitted complexity preset. */
export type ComplexityPreset = {
  label: string;
  turns: number;
  toolsPerTurn: number;
  medianCost: number;
  note: string;
};

export type SensitivityDriver = "turns" | "context" | "output";

export type AgentPricingResult = {
  model: import("./model").Model;
  turns: number;
  runs: number;
  /** Aggregate token counts across the whole run (× runs). */
  tokens: {
    cacheRead: number;
    cacheWrite: number;
    output: number;
    /** Fresh (uncached) input tokens — the miss fraction of the prefix. */
    inputFresh: number;
    total: number;
  };
  /** $ cost split, at the model's real rates. */
  cost: {
    cacheRead: number;
    cacheWrite: number;
    output: number;
    inputFresh: number;
    total: number;
  };
  /** The "average turn" as a per-prompt-style breakdown, for display. */
  perTurnCost: number;
  perTurnTokens: number;
  /** Uncertainty band ($) from the corpus residual (ln-σ ≈ 0.42). */
  band: { p10: number; p50: number; p90: number };
  /** Which input most drives the cost (largest Δ under a ±25% perturbation). */
  dominatedBy: SensitivityDriver;
  /**
   * Estimated model wall-clock (seconds) for the run: per turn, the time-to-
   * first-token plus the turn's output tokens ÷ the model's tokens/sec, summed
   * over all turns × runs. This is only the model's generation time — it
   * excludes tool execution, network, and human latency between turns, so a real
   * agent session takes longer, but it's what makes a fast model finish a
   * 120-turn loop in a fraction of a slow one's time. Uses measured speed when
   * available, else the tier fallback (see speed.ts / model.speed_source).
   */
  durationSeconds: number;
};

// ---------------------------------------------------------------------------
// Empirical defaults & priors (doc/agentic/PLAN.md, fitted to 544 runs).
// ---------------------------------------------------------------------------

/** Mechanism defaults, measured across the corpus. */
export const AGENT_DEFAULTS = {
  baseContextTokens: 35_300,
  contextGrowthPerTurn: 680,
  outputTokensPerTurn: 720,
  /** Reasoning models emit far more output; bump output/turn by this factor. */
  reasoningOutputMultiplier: 8,
  cacheHitRate: 0.96,
  toolsPerTurn: 0.5,
  /** Cache-write rate as a multiple of input rate (Anthropic 5m TTL default). */
  cacheWriteInputMultiplier: 1.25,
  /** Residual ln-σ of the fitted cost model → p10/p90 = median × exp(±1.28σ). */
  residualLnSigma: 0.42,
} as const;

/** The emergent power law, for the reference curve & sanity checks (Opus rates). */
export const AGENT_POWER_LAW = { a: 0.0331, b: 1.203 } as const;

export const TYPOLOGY_PRIORS: Record<AgentTypology, TypologyPrior> = {
  research: {
    label: "Research / plan",
    medianTurns: 184,
    medianCost: 18.43,
    costMu: 2.77,
    costSigma: 1.21,
    n: 119,
    note: "Reads broad, iterates — the expensive tail.",
  },
  refactor: {
    label: "Refactor",
    medianTurns: 241,
    medianCost: 31.11,
    costMu: 3.06,
    costSigma: 1.01,
    n: 7,
    note: "Long, wide-touching. Thin sample (n=7).",
  },
  feature: {
    label: "Feature",
    medianTurns: 121,
    medianCost: 9.14,
    costMu: 2.01,
    costSigma: 1.33,
    n: 198,
    note: "The workhorse; fattest tail — a tweak or a subsystem.",
  },
  bugfix: {
    label: "Bugfix",
    medianTurns: 114,
    medianCost: 7.71,
    costMu: 2.01,
    costSigma: 1.19,
    n: 42,
    note: "Focused; cost tracks how deep the hunt goes.",
  },
  chore: {
    label: "Chore",
    medianTurns: 80,
    medianCost: 5.43,
    costMu: 1.56,
    costSigma: 1.26,
    n: 51,
    note: "Bump / rename / configure — short and cheap.",
  },
  deploy: {
    label: "Deploy",
    medianTurns: 21,
    medianCost: 1.2,
    costMu: 0.23,
    costSigma: 0.4,
    n: 6,
    note: "Scripted, bounded, low variance.",
  },
};

export const COMPLEXITY_PRESETS: Record<AgentComplexity, ComplexityPreset> = {
  simple: {
    label: "Simple",
    turns: 9,
    toolsPerTurn: 0.44,
    medianCost: 0.58,
    note: "~1 min, a handful of tool calls.",
  },
  moderate: {
    label: "Moderate",
    turns: 40,
    toolsPerTurn: 0.5,
    medianCost: 2.11,
    note: "~5 min, ~20 tool calls.",
  },
  complex: {
    label: "Complex",
    turns: 162,
    toolsPerTurn: 0.5,
    medianCost: 15.14,
    note: "~24 min, ~80 tool calls.",
  },
};

/** Ready-made shapes people actually run, seeded from the priors. */
export type AgentPreset = {
  key: string;
  label: string;
  config: AgentRunConfig;
  note: string;
};

export const AGENT_PRESETS: AgentPreset[] = [
  {
    key: "coding-agent",
    label: "Coding agent over a repo",
    config: { turns: 120, toolsPerTurn: 0.6 },
    note: "The feature median — big repo context, many edits.",
  },
  {
    key: "rag-qa",
    label: "RAG question-answering",
    config: { turns: 8, toolsPerTurn: 1, contextGrowthPerTurn: 400 },
    note: "Short, retrieval-heavy, low context growth.",
  },
  {
    key: "batch-classify",
    label: "Batch classification",
    config: {
      turns: 3,
      toolsPerTurn: 0.1,
      contextGrowthPerTurn: 200,
      runs: 1000,
    },
    note: "Tiny loop × a high run count.",
  },
  {
    key: "scrape-summarise",
    label: "Scrape–summarise loop",
    config: { turns: 15, toolsPerTurn: 1.2, contextGrowthPerTurn: 900 },
    note: "Tool-heavy, moderate growth.",
  },
  {
    key: "research-plan",
    label: "Research / planning",
    config: { turns: 184, toolsPerTurn: 0.3 },
    note: "Read-broad, few edits — the expensive tail.",
  },
];
