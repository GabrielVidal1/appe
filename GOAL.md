# GOAL — where APPE is going

## North star

**Anyone about to spend money on AI can describe their task in plain words and,
in under a minute, get a trustworthy cost figure — in a browser or in a
terminal — for free, with the maths open to inspection.**

The bet: cost estimation is the one AI question nobody can answer confidently,
and every vendor's own calculator is a sales tool. APPE is the neutral one —
"a pricing calculator, but the model catalogue is a daily-synced open database
and the estimator is a library you can run yourself." Free and open source, no
account, no telemetry, no upsell. The unit of input is a **task** ("summarise
10k support tickets", "run this coding agent over my repo"), not a token count
— because the token count is exactly what the user doesn't know.

## Being worked on

<!-- Claims by goal-keeper agents. One bullet per in-flight item; remove
     yours in the same commit that ticks its checkbox. -->

## Target

- **Me (Gabriel)** — budget a homelab AI feature before writing it, and answer
  "which model should I run this on" with a number instead of a vibe.
- **Developers evaluating an AI feature** — need a defensible cost line for a
  spec or a PR: "this pipeline costs $X/month at Y items/day."
- **Indie hackers / small teams shipping AI products** — margin depends on
  picking the right model at the right provider; they need to compare all of
  them, not the three a vendor lists.
- **Scripters and CI pipelines** — want the same estimate from a command, in
  JSON, without opening a browser.

## Horizons

*(v0.1 "installable open-source tool" and v0.2 "agentic task costs" both
shipped — MIT + README, `@appe/core`, the `appe` CLI, and the full agentic
cost model with presets and sensitivity bands are all checked off below.)*

### Short term — v0.3 (now): numbers people can trust on every input

The estimator is right for the common case; close the gaps that would make a
specific answer wrong or unavailable.

- Settle and fix the cache-aware pricing self-inconsistency already flagged in
  the wishlist (`cachedCost` folded into `inputCost.total` but not
  `totalCost`) — a real bug, and a prerequisite for anything downstream that
  trusts the total.
- Model reasoning-token overhead in the **plain, non-agent** estimator too —
  today only `estimateAgentRun` applies `reasoningOutputMultiplier`; a single
  complex prompt to a `reasoning`-tagged model (o-series, GPT-5-thinking-class,
  DeepSeek-R-class) is silently undercosted on the main results table.
- Import a Claude Code / OpenAI usage export and re-price it against every
  other model ("what would this have cost on X") — already scoped in the
  wishlist below.
- An OG-image / static preview card for shared permalinks.

### Middle term — v0.4: build vs buy

APPE already knows a model's price *and*, since the parameter-count mining
(commit `08907b1`), its size and whether it's open-weight. That's exactly the
missing half of the question every self-hoster actually asks: "at my volume,
is the API cheaper or is a GPU?" Nobody else answers this from real model
economics instead of raw hardware specs.

- A self-host vs API comparison: for `license: "opensource"` models with a
  known `model_size`, estimate the GPU tier needed (VRAM from params ×
  quantization) and its hourly cloud-rental cost from a small, explicitly
  versioned reference table (a few named tiers — consumer/prosumer/datacenter
  — not a live pricing feed), then show the monthly token volume where
  self-hosting undercuts the cheapest matching API model.
- Make the static catalogue API (`/api/index.json`, `/api/models/*.json`,
  shipped in `08907b1`) actually citable outside the homelab: CORS headers on
  the static response and a one-page docs listing the shape + an example
  fetch, linked from the README. The data already exists; nothing outside
  `homelab_main` knows to reach for it yet.

### Long term — v1.0 / someday

APPE is the thing you reach for before you build anything with an LLM: paste a
task, point it at a repo or a real usage trace, or ask "self-host or API for
this workload" — and get a defensible number plus the cheapest model or
deployment that can actually do it. The catalogue is trusted enough that
people cite it or pull the static API into their own tools. Estimation stays
validated against reality (the usage-export re-pricing above is the first
step) rather than drifting into a second set of made-up numbers.

## Wishlist

Order roughly by value. Each item is one session of work.

- [x] Add an MIT `LICENSE` and rewrite `README.md` for outside contributors
      (install, dev, how the models.dev sync works, how to contribute).
- [x] Fix `package.json`: real name (`appe`), version `0.1.0`, description,
      repository/license fields.
      *(The root web-app `package.json` was still the scaffold's
      `vite_react_shadcn_ts@0.0.0`. Renamed to **`@appe/web`** — not bare `appe`,
      because `packages/cli` already owns the published `appe` name; `@appe/web`
      matches the `@appe/core` scope and stays `private: true` (the site isn't
      published). Added `version: 0.1.0`, a real `description`, `license: MIT`,
      `homepage`, `repository` (GitHub `GabrielVidal1/appe`) and `keywords`.
      Metadata-only, so behaviour-preserving: typecheck, `npm run build`, and 53
      unit tests all pass, and `npm ls --workspaces` still dedupes `@appe/core`
      across the app and the CLI.)*
- [x] Extract the estimator into `packages/core` (pure TS, no React): move
      `lib/computations.ts`, `lib/imageCost.ts`, `lib/tokenization/`,
      `data/index.ts` + the generated JSON; web app imports it. No behaviour
      change — the results table must be identical before/after.
      *(`@appe/core`, an npm workspace whose `exports` point at TS source; the
      types, constants and `format.ts` came along since the maths depends on
      them. The app now imports only from the `@appe/core` barrel — 33 files
      rewritten, no `@/lib/computations`-style import left. `sync-models.mjs`
      writes into `packages/core/src/data/`. Verified behaviour-preserving by
      dumping every text model × 4 data types × batch on/off through the old and
      the new estimator: the two 8 MB dumps are byte-identical; 44 tests, both
      typechecks and the build pass, and the built app still renders the results
      table.)*
- [x] Unit tests for the estimator core (vitest): token counts per data type,
      image tiling per provider, PDF per-page pricing, batch discounts.
      *(44 tests in `src/lib/__tests__/` + `src/data/__tests__/`, run with
      `npm test`. Written before the `packages/core` extraction on purpose:
      they pin today's numbers, so the extraction can be shown to be
      behaviour-preserving. Move them with the code.)*
- [x] `packages/cli` — `appe estimate` reading a task description + count,
      printing a ranked cost table; `--json`, `--provider`, `--tag`, `--top N`.
      *(The `appe` package: `parseArgs` (no dep) → `estimate.ts` (filter, rank,
      render) → `format.ts` (money + aligned table). `--count` takes `10k`/`1e6`;
      `--output`/`--output-tokens` set the output side, and with neither it
      assumes 500 and says so — output dominates most bills, so a silent 0 would
      have been a lie. Two display rules, not maths: models with `output_cost === 0`
      (embedders, rerankers, free tiers — models.dev gives them no distinguishing
      tag) are hidden unless `--include-free`, because otherwise they fill every
      row of an ascending cost sort with a useless $0.000001. Built by esbuild
      into one dependency-free `dist/appe.js` (`npm run build:cli`) — the one
      place core's TS-source exports get compiled. 9 new tests, one of which
      pins CLI output == the web app's `computeTokens`+`computePrices` for the
      same inputs, so the two can never drift.)*
- [x] CLI: `appe models` — search/filter the catalogue from the terminal
      (`appe models --tag reasoning --max-cost 1`).
      *(A sibling command to `estimate` in `packages/cli` (`src/models.ts`):
      lists `@appe/core`'s `ALL_TEXT_MODELS` — free-text `--query`/positional
      over name·id·provider, plus `--provider`/`--tag`/`--tier` (shared with
      `estimate`, one validated `parseFilters`), a `--max-cost N` that caps
      **both** input and output $/Mtok (a $0.1-in/$30-out model isn't "cheap"),
      and `--sort cost|input|output|context|name|provider`. Table adds a CONTEXT
      column (compact `200k`/`2M`) + TAGS; `--json` for pipelines. Unlike
      `estimate` it shows the whole catalogue (browsing, not ranking a bill).
      6 tests in `packages/cli/src/__tests__/models.test.ts` (69 total pass);
      typecheck + esbuild build green; verified end-to-end against the built
      `dist/appe.js`, and `estimate` is unchanged.)*
- [x] CLI: read the prompt from stdin / a file so it composes in pipelines.
      *(`-f, --file <path>` reads a file; `-f -` or a bare pipe reads stdin; an
      inline `--task` still wins. The source decision is pure and unit-tested
      in `packages/cli/src/input.ts` / `__tests__/input.test.ts` — file, stdin,
      inline-beats-pipe, empty and missing-file cases; verified end-to-end
      against the built `dist/appe.js` with `cat prompt | appe estimate`.)*
- [ ] Publish the CLI to npm as `appe` (bump + tag only; leave the actual
      publish credential step to a human).
      *(Audit note, 2026-08-09: the name is not free — npm already has an
      unrelated `appe@1.0.0` published by a different author over a year ago,
      so this needs a naming decision (scope it `@appe/cli`? pick another bare
      name?) before a human can run the publish step. No version tag exists
      yet in this repo either way (`git tag -l` is empty). Left unchecked —
      needs an owner decision, not just execution.)*
- [x] Agentic cost model in core: `estimateAgentRun({ turns, toolsPerTurn,
      contextGrowth, cacheHitRate, reasoning })` with cached-read pricing.
      *(`packages/core/src/agentCost.ts` + `types/agent.ts` — `estimateAgentRun`
      takes exactly this shape (`turns`, `toolsPerTurn`, `contextGrowthPerTurn`,
      `cacheHitRate`, `reasoning`), prices the per-turn growing-prefix re-read at
      `model.cache_cost` (cached-read rate), and returns a p10/p50/p90 band.
      Grounded in `doc/agentic/` — an empirical fit over 544 real Claude Code
      runs (aae2038, "docs(agentic): empirical cost model for v0.2"). Shipped in
      887e8a8 "feat(agent): beta agentic run estimator at /agent", 7 unit tests
      pin the cost≈0.033·N^1.20 law.)*
- [x] Agent presets (coding agent / RAG / batch classify / scrape-summarise)
      exposed in both GUI and CLI.
      *(`AGENT_PRESETS` in `packages/core/src/types/agent.ts` has exactly these
      four: `coding-agent`, `rag-qa`, `batch-classify`, `scrape-summarise`.
      Wired into the GUI's `AgentConfigPanel.tsx` preset chips (887e8a8) and the
      CLI's `--preset` flag in `estimateAgent.ts`/`index.ts` (2224b91
      "feat(cli): appe estimate-agent").)*
- [x] GUI: an "Agent" data type alongside prompts/images/pdfs/audio, wired
      through `computations.ts`, `urlConfig.ts`, the form and `TokenSummary`
      (see CLAUDE.md's checklist for adding a data type).
      *(Shipped a different way than originally scoped, per the 887e8a8 commit
      message's own framing: "ships the v0.2 'agentic task costs' feature as an
      isolated beta page" — `/agent` with its own components
      (`src/components/agent/`: `AgentConfigPanel`, `AgentModelTable`, cost
      headline, token breakdown, cost-vs-turns chart) rather than as a fifth
      value of the `prompts|images|pdfs|audio` data type inside
      `ResultsTableFiltered`/`computations.ts`/`urlConfig.ts`. Confirmed
      `computations.ts` and `urlConfig.ts` have no "agent" references — the main
      flow is untouched by design, avoiding destabilizing it. The underlying
      goal (agent-run cost estimation reachable from the GUI) is met.)*
- [x] Sensitivity / range output: show a low–high band and which input drives
      the cost, instead of a single point estimate.
      *(Delivered for agent runs: `agentCost.ts`'s `estimateAgentRun` returns a
      p10/p50/p90 band plus a `dominatedBy` sensitivity driver; the `/agent`
      page's cost headline shows the "80% band + sensitivity line" (887e8a8),
      and `appe estimate-agent` prints the same band + driver in the CLI
      (2224b91). Not present on the plain (non-agent) results table/estimate —
      if that's still wanted, it'd be a new, narrower item.)*
- [x] Fix the cache-aware pricing self-inconsistency in `computePrices`
      (`cachedCost` is folded into `inputCost.total` but *not* into
      `totalCost`, and the input cost is still billed at the full uncached
      rate on every item) — settle the intended semantics, *then* surface
      cache-aware pricing in the results table (models.dev has cached-read/
      write rates; big lever on agent costs).
      *(Settled semantics: of `dataCount` calls, only the first pays the full
      input rate — the rest read from cache at the (cheaper) `cache_cost`
      rate, mirroring how prompt caching actually bills in production.
      `packages/core/src/computations.ts`'s `computePrices` now reassigns
      `inputCost` to the single full-price call inside the `cache_cost !==
      null` branch (was unconditionally `× dataCount`, with the intended
      per-call reassignment dead-code-commented-out) and adds `cachedCost`
      into `totalCost` (was only folded into `inputCost.total`, so the two
      never agreed) — `totalCost` is now always exactly `inputCost.total +
      outputCost + …`, restoring the invariant the breakdown is supposed to
      satisfy. Two test files pinned the old self-inconsistent numbers on
      purpose (their own comments said so, citing this wishlist item) and are
      rewritten to pin the corrected math instead:
      `packages/core/src/__tests__/computations.test.ts`'s cache describe
      block, and `packages/cli/src/__tests__/estimate.test.ts`'s "does not
      drift" golden number plus its "scales linearly with --count" test — the
      fix makes cost genuinely *sub-linear* in `--count` for a cache-priced
      model (economies of scale from caching), so linearity now only holds
      for a model with no `cache_cost`; a new test asserts the sub-linear
      case explicitly instead of silently breaking the linear one. 104/104
      tests pass, typecheck and `npm run build` + `npm run build:cli` are all
      green. Verified end-to-end: the built CLI (`appe estimate --provider
      anthropic`) prices Claude Haiku 4.5 at 10k calls at $25.01, matching the
      new formula by hand (1 call × $1/Mtok + 9999 × $0.1/Mtok cached + output
      × $5/Mtok); a browserless screenshot of the built web app's results
      table (after entering a prompt and submitting) confirms it still
      renders real per-model costs with no regressions.
      Cache-aware pricing is not yet surfaced as its own column/breakdown in
      the results table — `totalCost` already reflects it, so that's now a
      thin, low-risk follow-up rather than blocked on this fix.)*
- [x] Model reasoning-token overhead in the plain (non-agent) estimator for
      models tagged `reasoning` — reuse `AGENT_DEFAULTS.reasoningOutputMultiplier`
      (today only `estimateAgentRun` applies it) and show a "+N tokens:
      reasoning overhead" note next to the affected row, so a single complex
      prompt to an o-series/GPT-5-thinking-class/DeepSeek-R-class model isn't
      silently undercosted.
      *(New exported `applyReasoningOverhead(rawOutputTokens, model)` in
      `packages/core/src/computations.ts`: for a `reasoning`-tagged model it
      inflates the raw output-token count by `reasoningOutputMultiplier` (8x)
      and returns the extra as `reasoningOverheadTokens`. Both `computeTokens`
      and `computeTokensAsync` call it, so `TokenResults`/`PricingResult` now
      always carry `reasoningOverheadTokens` (0 for a non-reasoning model) and
      `outputTokens`/`totalCost` already include it — no changes needed in
      `computePrices`, which just consumes whatever token counts it's handed.
      Surfaced in both consumers: the GUI's `ResultsTableRow` shows a "†"
      marker + tooltip on the Output Cost cell; the CLI's `appe estimate`
      prints "(+N tokens: reasoning overhead for <model>)" on the "Each item"
      line and adds `tokens.reasoningOverhead` to `--json`. The CLI's
      `--output-tokens`/assumed-default path (`withOutputOverride` in
      `packages/cli/src/estimate.ts`) re-applies the same helper per model —
      without that, the *common* CLI path (no `--output` sample given) would
      have kept silently undercosting reasoning models, since it bypasses
      `computeTokens`'s own tokenization entirely.
      **Caught and fixed in the same pass**: `estimate.test.ts`'s "does not
      drift from the web app" golden test pinned Claude Haiku 4.5 (now
      `reasoning`-tagged in the synced catalogue) at the old, undercosted
      $25 output cost — exactly the bug this item fixes. Rewrote it to derive
      the expected overhead via the new exported helper instead of a
      hardcoded number, so it can't silently re-pin a wrong value again;
      corrected total is $200 (500 × 8 × $5/Mtok × 10k), confirmed by hand.
      6 new unit tests (`computations.test.ts`), 108/108 total pass, both
      typechecks and all three builds (`npm run build`, `build:cli`) green.
      **Verified end-to-end**: built CLI against the real catalogue —
      `appe estimate --tag reasoning --provider openai` on GPT-5 Nano went
      from $0.2001/1000 items (pre-fix) to the correct $1.60/1000 items
      (8x, matching the multiplier) with the reasoning-overhead note printed
      and `reasoningOverhead:3500` in `--json`; ran the built web app via
      `vite preview` + browserless and confirmed the Output Cost column
      renders real per-model numbers with the new field wired through with
      no runtime errors (the reasoning-marker tooltip itself needs an example
      output typed in, which automation couldn't reliably drive through the
      form — the CLI and unit-test coverage carry the correctness proof).)*
- [ ] Self-host vs API comparison: for `license: "opensource"` models with a
      known `model_size`, derive a GPU tier (VRAM from params × quantization)
      and its hourly cloud-rental cost from a small versioned reference table,
      then surface the monthly token volume where self-hosting undercuts the
      cheapest matching API model. The parameter-count mining (`08907b1`)
      already has the data this needs; this is the feature it was for.
- [ ] Make the static catalogue API citable outside the homelab: add CORS
      headers to `/api/index.json` and `/api/models/*.json` (zipgo/static
      config) and a one-page docs listing the shape + an example `fetch`,
      linked from the README.
- [ ] Import a Claude Code / OpenAI usage export and re-price it against every
      other model ("what would this have cost on X").
- [ ] A shareable permalink already exists — add an OG-image endpoint or static
      card so a shared estimate previews with the number.
- [ ] Context-window utilization: a small bar/percentage next to each row's
      token count showing how much of that model's context window the task
      would use — cheap to compute (tokens ÷ `context_window`, already on
      every `Model`), and every competing token-counter tool treats it as a
      headline signal APPE's results table currently omits.
- [x] Accessibility + mobile pass on the results table (it's the core surface).
      *(The results table (`ResultsTableFiltered` + `table/ResultsTableRow`) had
      several a11y gaps: unlabeled select-all / per-row checkboxes, tier conveyed
      only by colored dots (silent to screen readers), a sort control with no
      `aria-sort`, no `scope` on headers, no table caption. Added: an sr-only
      `<caption>` describing the sort, `scope="col"` on every header, `aria-sort`
      on the Total Cost column reflecting the live order, an accessible sort-button
      label, `aria-label`s on all checkboxes (`Select <model>` / `Select all
      models`), and `role="img" aria-label="Tier: …"` on the dots (decorative dots
      `aria-hidden`). Mobile: the table now has a `min-w-[640px]` and lives in a
      focusable, labeled `role="region"` scroll container so narrow screens pan
      horizontally instead of crushing columns. Pure markup/attribute changes —
      82 tests, typecheck and build all green; verified in the running app via
      browserless that every attribute renders (caption, `aria-sort=ascending`,
      the region, `Tier: Medium`, per-model checkbox labels, 5 `scope=col`
      headers) and confirmed the 640px horizontal scroll on a 390px viewport.)*

## Non-goals (for now)

- **No accounts, no backend, no telemetry.** APPE stays a static site + a local
  CLI. Anything that needs a server is a different project.
- **Not a proxy / gateway / router.** It estimates cost; it does not call models
  on your behalf or spend your money.
- **Not a benchmark.** Quality/latency rankings are someone else's job — APPE
  answers "what does this cost", and only borrows quality signals if models.dev
  already carries them.
- **No hand-maintained model prices.** Everything comes from models.dev via the
  sync script; a wrong price is fixed upstream or in the mapping, never by
  editing the JSON.

## Guard rails (for the goal-keeper)

- One wishlist item per run, finished end-to-end: implement, typecheck
  (`npx tsc --noEmit -p tsconfig.app.json`), build, and verify the app still
  renders results before committing.
- **Never hand-edit** `src/data/models.json`, `provider_data.json`,
  `models.meta.json` or `public/logos/*` — they are generated by
  `scripts/sync-models.mjs`.
- Don't publish to npm and don't push git tags — bump versions, leave the
  release to a human.
- Don't touch the deploy cron (`scripts/sync-and-deploy.sh`, the 4:30 crontab
  entry) or the zipgo deploy target.
- Refactors (e.g. the core extraction) must be behaviour-preserving — if the
  estimate for the same inputs changes, that's a bug, not a feature.
- No paid API calls. APPE estimates costs; it must never incur them.
- The self-host GPU-rate table (v0.4) is a small, explicitly versioned static
  constant to be updated occasionally by hand — not a live pricing feed. Don't
  wire in a paid API to fetch real-time cloud GPU spot prices.

## Research log

<!-- Appended by the goal-seeder agent. Newest first. -->

### 2026-08-11 — seeded v0.3/v0.4

- v0.1 and v0.2 are both essentially shipped (every horizon bullet under them
  has a matching `[x]` below) — rolled the short/middle horizons forward
  instead of refilling a stalled list.
- Read the code (`packages/core/src/computations.ts` vs `agentCost.ts`):
  `reasoningOutputMultiplier` is only applied in the agent estimator, never in
  the plain single-shot one → a real, currently-silent undercost for
  `reasoning`-tagged models on a normal prompt. New wishlist item.
- https://www.navyaai.com/onprem-llm-cost-estimator ,
  https://curlscape.com/tools/llm-pricing-calculator → both compare
  self-hosting vs API cost from raw hardware specs. APPE's last commit
  (`08907b1`, mining `model_size` + publishing the static catalogue API) gives
  it the ingredient to do the same comparison from real per-model economics
  instead — the "build vs buy" v0.4 middle-term horizon + its wishlist item.
- https://docs.helicone.ai/references/how-we-calculate-cost ,
  OpenRouter's per-key spend dashboard → real-usage tracking with an account
  and a proxy. Explicitly out of scope: APPE's non-goals rule out accounts,
  backends and telemetry; noted and rejected, not added.
- https://tokencost.app/ , DevToolbox's token counter → both surface
  context-window utilization (% of the model's window used) as a headline
  stat; APPE's results table computes tokens but never divides by
  `context_window`. Cheap, high-signal, added as a wishlist item.
- Considered and rejected: migrating the UI from shadcn/Radix to `@gabvdl/ui`
  — no `@gabvdl/ui` import exists in this project today, but shadcn already
  gives it accessible primitives and the app just did an a11y pass on top of
  them; swapping design systems now would be pure churn with no capability
  gain, not a genuine gap. `npm outdated` on the Radix packages is all routine
  minor/patch bumps — no major-version payoff worth a wishlist item.
