# Agentic cost model — grounded in 544 real Claude Code runs

Design doc for APPE **v0.2** (GOAL.md "Middle term — agentic task costs"). It
answers the question a one-prompt estimator can't: *what does an **agent run**
cost — a loop of N turns with growing context, tool results fed back, and cache
hits on the prefix?*

Rather than guess the shape of that formula, this model is fitted to a corpus of
**610 Claude Code conversations** (544 real, human-initiated agent workflows
after filtering) pulled from the local transcript store and the ai-agent
archive. Every transcript carries per-message token usage (`input`, `output`,
`cache_read`, `cache_creation`) and timestamps, so cost is computed from real
usage at APPE's own catalogue prices — the numbers are internally consistent
with what the estimator produces.

Reproduce: `doc/agentic/{extract,analyze,mechanism}.mjs`; raw fit in
`doc/agentic/empirical-model.json`.

---

## 1. The one finding that matters

**Agent cost grows super-linearly with the number of AI messages.** Out-of-sample
(80/20 split, 432 train / 112 test):

```
cost ≈ 0.033 × (AI_messages) ^ 1.20      R² = 0.90 in-sample, 27% median abs error out-of-sample
```

The exponent **b ≈ 1.20 > 1** is the whole reason a naïve "input + output ×
count" estimate is wrong for agents. The driver: **cache-read is 96% of all
tokens** (median across the corpus). Every turn re-reads the accumulated
conversation prefix, and the prefix grows with every turn — so total cost
compounds. Output tokens (the thing a prompt estimator focuses on) are a
**rounding error** here: median **719 output tok/turn** vs **72,928 cache-read
tok/turn**.

Point predictions from the fitted law, with the empirical 80% band
(residual ln-σ = 0.42 → ×0.58 … ×1.72):

| AI messages | median cost | 80% band |
|---:|---:|---:|
| 5   | \$0.23  | \$0.13 – \$0.39 |
| 20  | \$1.20  | \$0.70 – \$2.06 |
| 50  | \$3.61  | \$2.10 – \$6.20 |
| 100 | \$8.30  | \$4.83 – \$14.27 |
| 200 | \$19.11 | \$11.12 – \$32.85 |
| 400 | \$43.99 | \$25.59 – \$75.61 |

These are Opus-4.8-class prices (the corpus is ~90% Opus). The model must scale
linearly with the chosen model's blended rate for other models — see §4.

## 2. The mechanism (what APPE actually simulates)

The power law is the *emergent* behaviour; APPE should expose the *mechanism*
that produces it, so the levers are legible ("your estimate is dominated by turn
count"). The mechanism is a growing-context loop:

- **Context grows roughly linearly in turns.** Fitting mean-prefix-per-turn
  against turn count:

  ```
  prefix_tokens(turn k) ≈ 35,300 + 680 × k
  ```

  → a **base working set ≈ 35k tokens** (system prompt + tools + repo context
  loaded up front) and **≈ 680 tokens added per turn** (the tool call + its
  result + the assistant's reasoning, appended to the transcript).

- **Each turn re-reads the whole prefix as a cache-read.** So the cache-read
  bill over N turns is `Σ prefix(k) ≈ N·base + 680·N²/2` — **quadratic in N**.
  Blended with the (small, linear) output cost and (small) cache-write cost, the
  observed exponent lands at ~1.2, not 2.0.

- **Cache-write** happens once per growth step (~1.25× input rate); **cache-read**
  is 0.1× input. The economics: you pay a little to write the delta, then a lot
  (in aggregate) to re-read the whole prefix every turn. Prompt caching is what
  makes agents affordable at all — without it this would be ~10× worse — but it
  is also why cost is dominated by turn count, not output length.

### Per-turn unit economics (medians, the atomic constants)

| quantity | median | p25 | p75 |
|---|---:|---:|---:|
| cost / AI message | \$0.08 | \$0.06 | \$0.11 |
| total tok / AI message | 76,440 | | |
| — of which cache-read | 72,928 | | |
| — of which output | 719 | | |
| tool calls / AI message | 0.49 | | |

`$0.08/turn` is the single most useful back-of-envelope constant: **an agent
turn costs about a dime.**

## 3. Cost distribution by task typology

Typology is classified from the first user prompt (keyword families) plus tool
mix. This gives the "standard conversation cost by task type" the request asks
for. Cost per type is **lognormal** — fit `mu, sigma` of `ln($)` below; sample a
band with `exp(mu ± 1.28·sigma)` for p10–p90.

| typology | n | median | p25 | p75 | p90 | med msgs | lognormal (μ, σ) |
|---|---:|---:|---:|---:|---:|---:|---|
| **refactor** | 7   | \$31.11 | \$15.04 | \$46.58 | \$51.55 | 241 | 3.06, 1.01 |
| **research/plan** | 119 | \$18.43 | \$7.44  | \$36.87 | \$68.80 | 184 | 2.77, 1.21 |
| **feature**  | 198 | \$9.14  | \$2.81  | \$19.81 | \$35.95 | 121 | 2.01, 1.33 |
| **bugfix**   | 42  | \$7.71  | \$3.68  | \$15.09 | \$25.99 | 114 | 2.01, 1.19 |
| **chore**    | 51  | \$5.43  | \$2.26  | \$11.22 | \$20.97 | 80  | 1.56, 1.26 |
| **other**    | 121 | \$4.37  | \$1.11  | \$11.30 | \$23.48 | 76  | 1.21, 1.71 |
| **deploy**   | 6   | \$1.20  | \$0.92  | \$1.79  | \$2.09  | 21  | 0.23, 0.40 |

Reading it: **research/planning and refactors are the expensive shapes** — they
run the most turns (184, 241 median) because they read broadly and iterate.
**Deploys are cheap and tight** (21 turns, low variance σ=0.40) — a scripted,
bounded action. Features sit in the middle but have the fattest tail
(σ=1.33): "add X" ranges from a 20-turn tweak to a 300-turn subsystem.

## 4. Cost distribution by complexity

Complexity is a continuous 0–1 score = mean of log-scaled (turns, tool calls,
edits, duration), bucketed. This is the cleanest predictor — near-monotone and
tight:

| complexity | n | median | p25 | p75 | med msgs | med tools | med dur |
|---|---:|---:|---:|---:|---:|---:|---:|
| **simple**   | 62  | \$0.58  | \$0.32 | \$0.98  | 9   | 4  | 1 min |
| **moderate** | 115 | \$2.11  | \$1.60 | \$3.17  | 40  | 20 | 5 min |
| **complex**  | 367 | \$15.14 | \$8.13 | \$28.07 | 162 | 81 | 24 min |

A ~26× median swing from simple to complex, and the buckets barely overlap at
the quartiles — complexity is the axis APPE's UI should let the user set most
directly (a slider or three presets), with typology and project as adjustments.

## 5. Cost distribution by project

Per-project baselines (projects with ≥3 runs). Useful as a "house style"
multiplier — some projects just run longer sessions.

| project | n | median | p25 | p75 | med msgs |
|---|---:|---:|---:|---:|---:|
| sherlock-project | 5   | \$40.15 | \$19.28 | \$54.51 | 367 |
| card-editor      | 5   | \$30.50 | \$14.06 | \$43.49 | 207 |
| qrepair          | 3   | \$28.16 | \$19.47 | \$42.62 | 127 |
| ai-agent         | 11  | \$27.97 | \$19.30 | \$58.05 | 179 |
| mail             | 3   | \$21.46 | \$16.38 | \$42.92 | 149 |
| design-system    | 34  | \$19.15 | \$11.88 | \$31.02 | 192 |
| insta-pics       | 6   | \$18.40 | \$14.35 | \$21.95 | 203 |
| fight-game       | 5   | \$17.84 | \$9.85  | \$58.53 | 160 |
| homelab          | 442 | \$6.74  | \$2.22  | \$17.20 | 95  |
| gabvdl           | 4   | \$6.73  | \$2.99  | \$15.54 | 99  |
| appe             | 6   | \$2.11  | \$0.65  | \$19.73 | 35  |
| zipgo            | 5   | \$0.89  | \$0.46  | \$7.32  | 12  |

Project variance is mostly explained by typical turn count (frontend app
projects → long UI-iteration sessions; infra chores on `homelab`/`zipgo` →
short). So "project" is not an independent factor — it is a **prior on turn
count and typology**. APPE should treat it as an optional multiplier, not a
first-class input.

## 6. Proposed data model

The core stays framework-free (`packages/core`). Add an agentic module beside
the existing per-prompt one — it *composes* the existing `computePrices` per
turn rather than replacing it.

```ts
// packages/core/src/types/agent.ts

/** How the user describes an agent run. All fields optional beyond turns —
 *  presets and typology fill the rest. */
export type AgentRunConfig = {
  turns: number;                 // N — the dominant lever (AI messages)
  toolsPerTurn?: number;         // default 0.5 (empirical median 0.49)
  baseContextTokens?: number;    // default 35_300  (system+tools+repo)
  contextGrowthPerTurn?: number; // default 680      (delta appended each turn)
  outputTokensPerTurn?: number;  // default 720
  cacheHitRate?: number;         // 0..1, share of prefix served as cache-read
                                 // (default 0.96 — measured)
  reasoning?: boolean;           // reasoning models bill thinking tokens as output
  typology?: AgentTypology;      // adjusts turns/variance when turns not given
  runs?: number;                 // batch: repeat the whole run `runs` times
};

export type AgentTypology =
  | "feature" | "bugfix" | "refactor" | "research" | "chore" | "deploy";

/** Per-typology priors fitted from the corpus (doc/agentic/empirical-model.json).
 *  Used when the user picks a typology instead of a turn count, and to render
 *  the p10–p90 band. */
export type TypologyPrior = {
  medianTurns: number;
  costMu: number;      // ln($) mean
  costSigma: number;   // ln($) sd  → band = exp(mu ± 1.28σ)
};

export type AgentPricingResult = PricingResult & {
  turns: number;
  perTurn: PricingResult;        // the "average turn" breakdown
  band: { p10: number; p50: number; p90: number };  // $ uncertainty band
  dominatedBy: "turns" | "context" | "output";       // sensitivity headline
};
```

### The estimator (mechanism, not the emergent power law)

```ts
// packages/core/src/agentCost.ts  (sketch)
export function estimateAgentRun(cfg: AgentRunConfig, model: Model): AgentPricingResult {
  const base = cfg.baseContextTokens ?? 35_300;
  const grow = cfg.contextGrowthPerTurn ?? 680;
  const hit  = cfg.cacheHitRate ?? 0.96;
  const out  = cfg.outputTokensPerTurn ?? 720;

  let cacheRead = 0, cacheWrite = 0, output = 0;
  for (let k = 1; k <= cfg.turns; k++) {
    const prefix = base + grow * k;
    cacheRead  += prefix * hit;          // re-read the accumulated context
    cacheWrite += grow * (1 - 0) ;       // write the new delta (≈ grow)
    output     += out;
  }
  // price with the model's own rates: cache_read = cache_cost,
  // cache_write ≈ 1.25 × input_cost, output = output_cost
  // ...multiply by cfg.runs, apply batch discount where legal...
}
```

Because it iterates turns and prices each with the model's real rates, swapping
the model just re-scales the bill — the same `Model[]` catalogue that powers the
prompt estimator drives the agent estimator, so the "compare every provider"
promise carries straight over to agent runs. Cheaper models (Haiku, Sonnet) drop
the bill proportionally; that comparison is the point.

### Sanity anchor

The mechanism must reproduce the empirical power law. With the default
constants, `estimateAgentRun({turns: N})` at Opus rates should land within the
80% band of `0.033·N^1.20` for N ∈ {20,50,100,200}. A unit test pins this (the
same "two consumers must never disagree" discipline the repo already uses).

## 7. Presets (GUI + CLI)

Ship the shapes people actually run, each a `Partial<AgentRunConfig>` seeded
from the typology priors:

| preset | turns | tools/turn | notes |
|---|---:|---:|---|
| Coding agent over a repo | 120 | 0.6 | the `feature` median; big context base |
| RAG question-answering    | 8   | 1.0 | short, retrieval-heavy, low growth |
| Batch classification      | 3   | 0.1 | tiny loop × high `runs` count |
| Scrape–summarise loop     | 15  | 1.2 | tool-heavy, moderate growth |
| Research / planning        | 184 | 0.3 | the expensive tail; read-broad, few edits |

Wired into the GUI as a new **"Agent"** data type alongside
prompts/images/pdfs/audio (per CLAUDE.md's add-a-data-type checklist:
`types/`, both `computations` fns, `urlConfig.ts`, the form, `TokenSummary`), and
`appe estimate-agent` in the CLI with the same core.

## 8. Sensitivity output

The corpus makes the headline easy and honest: for almost every run,
**turn count dominates** (b≈1.2, R²=0.90 vs 0.49 for duration). So the default
sensitivity line is:

> "\$3.6 (\$2.1–\$6.2). Dominated by turn count — halving turns to 25 → ~\$1.6."

Compute `dominatedBy` by perturbing each input ±25% and reporting the largest
Δcost. In practice it will read `turns` nearly always, `context` for very long
sessions, `output` almost never — which is itself the lesson APPE teaches.

## 9. What this deliberately does not claim

- **n is thin for rare typologies** (refactor n=7, deploy n=6) and small
  projects (n=3–6). Those medians are directional; the band (σ) is the honest
  part. Feature/research/complex buckets (n=119–367) are solid.
- **The corpus is ~90% Opus-4.8 and one user.** The *shape* (super-linear in
  turns, cache-read-dominated, per-typology ordering) is a property of agentic
  loops and should generalise; the *absolute dimes-per-turn* is Opus-priced and
  re-scales by model. It is not a claim about how *your* agent behaves.
- **Classification is heuristic** (keyword + tool mix), so "other" (n=121) is a
  real bucket, not noise — it's the prompts that don't announce their intent.
- This estimates **cost**, not quality or latency — same non-goals as the rest
  of APPE.

---

### Corpus at a glance

544 real agent conversations · median **\$8.50** / run · median **115** AI
messages · median **15 min** · median **96%** of tokens are cache-reads · mean
\$16.99 (the tail is heavy — lognormal μ=1.95, σ=1.49).
