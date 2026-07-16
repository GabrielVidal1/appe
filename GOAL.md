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

- [appe] CLI: `appe models` — search/filter the catalogue from the terminal — @2026-07-16T22:02Z

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

### Short term — v0.1 (now): a real, installable open-source tool

The web app already works; make it a project people can actually adopt.

- An OSI license (MIT) and a contributor-facing README (not the scaffold one).
- The estimator core extracted out of `src/lib/` into a framework-free package
  (`@appe/core`: token estimation + pricing math + the models.dev catalogue),
  imported by the web app so the two never drift.
- A `appe` CLI on top of that core: `appe estimate --task "…" --count 1000`
  → a ranked table of models and costs, `--json` for pipelines.
- The web app renamed and versioned properly (`package.json` is still
  `vite_react_shadcn_ts@0.0.0`).

### Middle term — v0.2: agentic task costs

Estimate what an **agent run** costs, not just one prompt. An agent is a loop:
N turns, growing context, tool results fed back in, cache hits on the prefix.
That's a different formula from "input + output × count", and nobody offers it.

- A model of an agentic run: turns, tools per turn, context growth, prompt
  caching (cached-read vs write pricing), reasoning-token overhead.
- Presets for the shapes people actually run — coding agent over a repo, RAG
  question-answering, batch classification, a scraper-summariser loop.
- Sensitivity output: "the estimate is $2–$18; it is dominated by turn count."
- `appe estimate-agent` in the CLI with the same model.

### Long term — v1.0 / someday

APPE is the thing you reach for before you build anything with an LLM: paste a
task (or point it at a repo, a dataset, an agent trace), get cost, latency and
the cheapest model that can actually do it. The core is a package other tools
import; the catalogue is trusted enough that people cite it. Possibly it reads
a real usage log (an Anthropic/OpenAI billing export, a Claude Code transcript)
and tells you what you *would have* paid on every other model — estimation
validated against reality.

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
- [ ] CLI: `appe models` — search/filter the catalogue from the terminal
      (`appe models --tag reasoning --max-cost 1`).
- [x] CLI: read the prompt from stdin / a file so it composes in pipelines.
      *(`-f, --file <path>` reads a file; `-f -` or a bare pipe reads stdin; an
      inline `--task` still wins. The source decision is pure and unit-tested
      in `packages/cli/src/input.ts` / `__tests__/input.test.ts` — file, stdin,
      inline-beats-pipe, empty and missing-file cases; verified end-to-end
      against the built `dist/appe.js` with `cat prompt | appe estimate`.)*
- [ ] Publish the CLI to npm as `appe` (bump + tag only; leave the actual
      publish credential step to a human).
- [ ] Agentic cost model in core: `estimateAgentRun({ turns, toolsPerTurn,
      contextGrowth, cacheHitRate, reasoning })` with cached-read pricing.
- [ ] Agent presets (coding agent / RAG / batch classify / scrape-summarise)
      exposed in both GUI and CLI.
- [ ] GUI: an "Agent" data type alongside prompts/images/pdfs/audio, wired
      through `computations.ts`, `urlConfig.ts`, the form and `TokenSummary`
      (see CLAUDE.md's checklist for adding a data type).
- [ ] Sensitivity / range output: show a low–high band and which input drives
      the cost, instead of a single point estimate.
- [ ] Show cache-aware pricing in the results table (models.dev has
      cached-read/write rates) — big lever on agent costs. **Note:** in
      `computePrices`, `cachedCost` is folded into `inputCost.total` but *not*
      into `totalCost`, and the input cost is still billed at the full
      (uncached) rate on every item — so today's cache handling is
      self-inconsistent. Settle the intended semantics before surfacing it.
- [ ] Import a Claude Code / OpenAI usage export and re-price it against every
      other model ("what would this have cost on X").
- [ ] A shareable permalink already exists — add an OG-image endpoint or static
      card so a shared estimate previews with the number.
- [ ] Accessibility + mobile pass on the results table (it's the core surface).

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
