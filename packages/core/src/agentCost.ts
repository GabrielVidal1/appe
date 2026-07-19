import { Model } from "./types/model";
import {
  AGENT_DEFAULTS,
  AgentPricingResult,
  AgentRunConfig,
  SensitivityDriver,
} from "./types/agent";
import { modelSpeed } from "./speed";

/**
 * Estimate the cost of an agentic run for a single model.
 *
 * The model is the *mechanism* behind the empirical power law
 * (cost ≈ 0.033·N^1.20 at Opus rates): a loop where each turn re-reads the
 * accumulated context prefix as a cache-read, appends a small delta (a
 * cache-write), and emits a little output. Summed over N turns the cache-read
 * bill is ~quadratic in N, which is where the super-linear cost comes from.
 *
 * It prices every token at the model's own catalogue rates, so the same
 * catalogue that powers the prompt estimator drives this one — swapping the
 * model just re-scales the bill. See `doc/agentic/PLAN.md` for the fit.
 */
export function estimateAgentRun(
  cfg: AgentRunConfig,
  model: Model
): AgentPricingResult {
  const r = runTokensAndCost(cfg, model);

  const s = AGENT_DEFAULTS.residualLnSigma;
  const band = {
    p10: r.cost.total * Math.exp(-1.28 * s),
    p50: r.cost.total,
    p90: r.cost.total * Math.exp(1.28 * s),
  };
  const effectiveTurns = r.turns * r.runs || 1;

  // Wall-clock: each turn pays a small first-token latency once, then emits its
  // output tokens at the model's tokens/sec. Summed over every turn of every run.
  // `r.tokens.output` is the total output across the whole run(s), so dividing by
  // tps gives all generation time; the latency is charged per turn.
  //
  // Note on TTFT for the agent loop: a benchmark's time-to-first-token for a
  // *reasoning* model bundles the thinking phase into "first token" (tens of
  // seconds on a fresh, uncached request). Charging that every turn would
  // double-count — we already price reasoning as extra output tokens (the bulk
  // of the time) via reasoningOutputMultiplier. So for the per-turn latency we
  // cap TTFT at a realistic prefill/queue ceiling; the thinking time is already
  // in the output term. The single-shot default estimator keeps the raw TTFT.
  const { tps, ttft } = modelSpeed(model);
  const perTurnLatency = Math.min(ttft, AGENT_DEFAULTS.maxPerTurnTtftSeconds);
  const durationSeconds = perTurnLatency * effectiveTurns + r.tokens.output / tps;

  return {
    model,
    turns: r.turns,
    runs: r.runs,
    tokens: {
      cacheRead: Math.round(r.tokens.cacheRead),
      cacheWrite: Math.round(r.tokens.cacheWrite),
      output: Math.round(r.tokens.output),
      inputFresh: Math.round(r.tokens.inputFresh),
      total: Math.round(r.tokens.total),
    },
    cost: r.cost,
    perTurnCost: r.cost.total / effectiveTurns,
    perTurnTokens: Math.round(r.tokens.total / effectiveTurns),
    band,
    dominatedBy: sensitivity(cfg, model, r.cost.total),
    durationSeconds,
  };
}

/** The pure token+cost computation, with no sensitivity pass (so it can be
 *  called repeatedly by `sensitivity` without recursing). */
function runTokensAndCost(cfg: AgentRunConfig, model: Model) {
  const turns = Math.max(0, Math.floor(cfg.turns));
  const runs = Math.max(1, Math.floor(cfg.runs ?? 1));
  const base = cfg.baseContextTokens ?? AGENT_DEFAULTS.baseContextTokens;
  const grow = cfg.contextGrowthPerTurn ?? AGENT_DEFAULTS.contextGrowthPerTurn;
  const hit = clamp01(cfg.cacheHitRate ?? AGENT_DEFAULTS.cacheHitRate);
  const out =
    (cfg.outputTokensPerTurn ?? AGENT_DEFAULTS.outputTokensPerTurn) *
    (cfg.reasoning ? AGENT_DEFAULTS.reasoningOutputMultiplier : 1);

  // Per-run token totals by summing over the growing prefix.
  let cacheRead = 0;
  let inputFresh = 0;
  let cacheWrite = 0;
  let output = 0;
  for (let k = 1; k <= turns; k++) {
    const prefix = base + grow * k; // context size at turn k
    cacheRead += prefix * hit; // the cached fraction, re-read every turn
    inputFresh += prefix * (1 - hit); // the miss fraction, billed at input rate
    cacheWrite += grow; // write the newly-appended delta once
    output += out;
  }

  // Scale to the requested number of identical runs.
  cacheRead *= runs;
  inputFresh *= runs;
  cacheWrite *= runs;
  output *= runs;

  // Price at the model's real rates ($/Mtok).
  const M = 1e6;
  const cacheReadRate = model.cache_cost ?? model.input_cost * 0.1;
  const cacheWriteRate =
    model.input_cost * AGENT_DEFAULTS.cacheWriteInputMultiplier;

  const costCacheRead = (cacheRead * cacheReadRate) / M;
  const costInputFresh = (inputFresh * model.input_cost) / M;
  const costCacheWrite = (cacheWrite * cacheWriteRate) / M;
  const costOutput = (output * model.output_cost) / M;
  const total = costCacheRead + costInputFresh + costCacheWrite + costOutput;

  return {
    turns,
    runs,
    tokens: {
      cacheRead,
      cacheWrite,
      output,
      inputFresh,
      total: cacheRead + inputFresh + cacheWrite + output,
    },
    cost: {
      cacheRead: costCacheRead,
      cacheWrite: costCacheWrite,
      output: costOutput,
      inputFresh: costInputFresh,
      total,
    },
  };
}

/**
 * Which input drives the cost: perturb each ±25% and report the largest
 * absolute change in total cost. In practice this reads "turns" almost always
 * — which is the lesson the tool teaches.
 */
function sensitivity(
  cfg: AgentRunConfig,
  model: Model,
  base: number
): SensitivityDriver {
  const dTurns = Math.abs(
    runTokensAndCost({ ...cfg, turns: cfg.turns * 1.25 }, model).cost.total -
      base
  );
  const dContext = Math.abs(
    runTokensAndCost(
      {
        ...cfg,
        contextGrowthPerTurn:
          (cfg.contextGrowthPerTurn ?? AGENT_DEFAULTS.contextGrowthPerTurn) *
          1.25,
      },
      model
    ).cost.total - base
  );
  const dOutput = Math.abs(
    runTokensAndCost(
      {
        ...cfg,
        outputTokensPerTurn:
          (cfg.outputTokensPerTurn ?? AGENT_DEFAULTS.outputTokensPerTurn) * 1.25,
      },
      model
    ).cost.total - base
  );
  const max = Math.max(dTurns, dContext, dOutput);
  if (max === dTurns) return "turns";
  if (max === dContext) return "context";
  return "output";
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
