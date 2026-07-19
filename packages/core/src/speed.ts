import { Model, ModelSize } from "./types/model";

/**
 * Duration (wall-clock time) estimation.
 *
 * APPE prices tokens; this module turns those tokens into *time*. The reason
 * smaller models feel faster is almost entirely generation speed: a model emits
 * output at some tokens-per-second (`speed_tps`), after an initial
 * time-to-first-token latency (`ttft_s`). Input is prefilled in bulk and is
 * usually negligible next to autoregressive generation, so:
 *
 *     duration ≈ ttft + outputTokens / tps
 *
 * The speed numbers come from the Artificial Analysis benchmark when available
 * (sync-models.mjs, model.speed_source === "measured"). Models the benchmark
 * doesn't cover — the long tail of the 5k-model catalogue — fall back to a
 * tier-based estimate here (small≈fast, big≈slow). That fallback is deliberately
 * coarse and always flagged as "estimated" in the UI; it exists so the feature
 * works for every model, with or without a benchmark key.
 */

/**
 * Fallback output speed (tokens/sec) by price tier, for models with no measured
 * benchmark. These are order-of-magnitude medians across hosted models as of
 * mid-2026: small/cheap models are commonly served at ~120 tok/s, mid-tier at
 * ~70, frontier "big" models at ~45. They are intentionally round — the point is
 * the *relative* ordering (small faster than big), not spurious precision.
 */
export const TIER_FALLBACK_TPS: Record<ModelSize, number> = {
  small: 120,
  medium: 70,
  big: 45,
};

/**
 * Fallback time-to-first-token (seconds) by tier. Bigger models generally have
 * a longer prefill/queue latency. Again coarse, again "estimated".
 */
export const TIER_FALLBACK_TTFT: Record<ModelSize, number> = {
  small: 0.3,
  medium: 0.5,
  big: 0.8,
};

/** The speed numbers for a model, preferring measured, falling back to tier. */
export function modelSpeed(model: Pick<Model, "speed_tps" | "ttft_s" | "tier">): {
  tps: number;
  ttft: number;
} {
  const tps =
    model.speed_tps && model.speed_tps > 0
      ? model.speed_tps
      : TIER_FALLBACK_TPS[model.tier];
  const ttft =
    model.ttft_s != null && model.ttft_s >= 0
      ? model.ttft_s
      : TIER_FALLBACK_TTFT[model.tier];
  return { tps, ttft };
}

/**
 * Estimate the wall-clock time (seconds) to produce `outputTokens` from a model.
 * `ttft` is charged once (the latency to first token); the rest is generation at
 * `tps`. Pass an explicit `count` for repeated *sequential* requests; for
 * *parallel* (batch) requests keep count at 1 and report per-item time — batch
 * wall-clock is not the sum.
 */
export function estimateDuration(
  model: Pick<Model, "speed_tps" | "ttft_s" | "tier">,
  outputTokens: number,
  count = 1
): number {
  const { tps, ttft } = modelSpeed(model);
  const perItem = ttft + Math.max(0, outputTokens) / tps;
  return perItem * Math.max(1, count);
}

/** Human-readable duration: "0.8s", "3.2s", "1m 20s", "12m", "1h 4m". */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const totalMin = Math.floor(seconds / 60);
  const remSec = Math.round(seconds % 60);
  if (totalMin < 60) {
    return remSec > 0 ? `${totalMin}m ${remSec}s` : `${totalMin}m`;
  }
  const hours = Math.floor(totalMin / 60);
  const remMin = totalMin % 60;
  return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
}
