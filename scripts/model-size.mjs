// model-size.mjs — the one place a model's parameter count is decided.
// Imported by scripts/sync-models.mjs (which stamps it into every catalogue
// entry) and by its unit test. Kept out of the sync script itself so it can be
// imported without running a sync.

/**
 * Parameter count (billions) read out of the model's id/name.
 *
 * models.dev carries no parameter count, but open-weight models spell it in
 * their name — `llama-3.2-1b-instruct`, `gpt-oss-120b`, `Qwen3 Coder 480B A35B`,
 * `mixtral-8x22b`. So we mine it:
 *   - `8x22b` (MoE experts) → 8 × 22 = 176B total;
 *   - the **largest** plain `<n>b` wins, which drops the *active*-parameter half
 *     of a `235b-a22b` MoE pair (22 < 235) and keeps the total;
 *   - anything above 5000B is a false positive (a date, a quantisation) → null.
 * Closed models (gpt-5, claude-*, gemini-*) legitimately have no size and stay
 * null — the UI renders them without a size chip rather than guessing.
 */
export function deriveModelSize(id, name) {
  const hay = `${id} ${name}`.toLowerCase();
  const sizes = [];
  for (const [, experts, size] of hay.matchAll(/\b(\d+)x(\d+(?:\.\d+)?)\s*b\b/g))
    sizes.push(Number(experts) * Number(size));
  for (const [, size] of hay.matchAll(/(?:^|[^a-z0-9.])(\d+(?:\.\d+)?)\s*b\b/g))
    sizes.push(Number(size));
  const best = Math.max(0, ...sizes.filter((n) => Number.isFinite(n) && n > 0 && n <= 5000));
  return best > 0 ? best : null;
}
