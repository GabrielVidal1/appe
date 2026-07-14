# CLAUDE.md — APPE (AI Processing Price Estimator)

Guidance for Claude Code when working in this repo.

Where this is going is defined in [GOAL.md](GOAL.md) — read it before proposing
features.

## What this is

A single-page Vite + React + TypeScript + Tailwind/shadcn app that estimates and
compares AI inference cost across providers for a given workload (text, image,
PDF or audio). It is a static site, deployed to zipgo on raspy2 at
**https://appe.dev.gabvdl.xyz**. Remote is GitHub: `GabrielVidal1/appe`.

## Model data comes from models.dev — do not hand-edit it

The model catalogue is **generated**, not hand-maintained. `scripts/sync-models.mjs`
fetches `https://models.dev/api.json` (and the per-provider logos from
`https://models.dev/logos/<id>.svg`) and writes:

- `packages/core/src/data/models.json` — flat `Model[]` of every estimable model (~4.9k across
  ~144 providers). One entry per provider×model (the same base model appears
  under many providers at different prices — that's intentional for comparison).
- `packages/core/src/data/provider_data.json` — per-provider display name, batch discount, and
  known PDF pricing knobs.
- `packages/core/src/data/models.meta.json` — `{ source, generatedAt, providerCount,
  modelCount, logoCount }`, surfaced in the hero and footer.
- `public/logos/<id>.svg` — provider logos, inlined by `ProviderIcons`.

**Treat all of the above as generated.** To change model data, edit the sync
script's mapping and re-run `node scripts/sync-models.mjs`, don't edit the JSON.

Mapping notes (see the script for detail):
- `Provider` is an open `string`, not a fixed union. Never switch exhaustively on
  provider; use `getProviderParams()` (safe fallback) and `ProviderIcon` (Bot
  fallback).
- Included input modalities: text, image, pdf, audio, video. Audio input is
  estimated (duration × tokens/sec, default 32); video is included but not
  separately priced. `input_audio_cost` holds the dedicated audio $/Mtok when
  models.dev has one, else the estimator falls back to `input_cost`.
- `tier` is a heuristic from blended $/Mtok; `tags` are derived from capability
  flags (vision/audio/video/reasoning/tools/opensource).

## Daily sync

A user crontab entry (`30 4 * * *`) runs `scripts/sync-and-deploy.sh`, which
syncs, rebuilds and redeploys. So committed JSON is just a seed — the live site
refreshes daily.

## Common commands

```bash
npm run dev                     # local dev server (Vite, port 8080)
npm test                        # vitest — estimator unit tests (src/**/__tests__)
node scripts/sync-models.mjs    # refresh model + logo data from models.dev
npm run build                   # type-checked production build
npm run deploy                  # build + deploy to zipgo (scripts/deploy.sh)
npx tsc --noEmit -p tsconfig.app.json   # typecheck
```

## Architecture pointers

- **The estimator is a package, not app code.** It lives in `packages/core`
  (`@appe/core`) — an npm workspace of pure, framework-free TypeScript: the
  catalogue, the tokenizers, the image/PDF/audio rules and the pricing maths.
  Both front-ends import it through the barrel (`import { … } from "@appe/core"`)
  and *nothing else* — there is no second copy of a formula to keep in sync.
  Anything that computes a token count or a cost belongs there; anything that
  renders belongs in `src/` (browser) or `packages/cli/` (terminal).
- **There are two consumers of the core, and they must never disagree.** The web
  app (`src/`) and the `appe` CLI (`packages/cli`). If the same inputs produce a
  different number in the terminal and in the browser, that is a bug — a test in
  `packages/cli/src/__tests__/estimate.test.ts` pins that equality on purpose.
- **The CLI** (`packages/cli`, published name `appe`): `src/index.ts` parses args
  with node's built-in `parseArgs` (no dependency), `src/estimate.ts` filters,
  ranks and renders, `src/format.ts` does money + table layout. Build it with
  `npm run build:cli` — esbuild bundles core, its deps and the models.dev JSON
  into a single dependency-free `packages/cli/dist/appe.js`. That bundle is the
  one place the core's TS *source* exports actually get compiled (node cannot
  import them raw), which is why the CLI has a build step and the web app just
  aliases. Two rules live in the CLI as *display* choices, never in the maths:
  models with `output_cost === 0` (embedders, rerankers, free tiers) are hidden
  unless `--include-free`, and with neither `--output` nor `--output-tokens` it
  assumes 500 output tokens and labels the estimate as assumed.
- Estimation math: `packages/core/src/computations.ts` (tokens + prices),
  `imageCost.ts`, `tokenization/`. A data type (`prompts|images|pdfs|audio`)
  drives which input tokens are computed. It is covered by unit tests in
  `packages/core/src/__tests__/` (vitest, `vitest.config.ts`) — they pin the
  current numbers, so a failing test after a refactor means the estimate moved.
  Change a number only on purpose.
- Data access + derived lists: `packages/core/src/data/index.ts` (`ALL_MODELS`,
  `ALL_TEXT_MODELS`, `ALL_PROVIDERS`, `ALL_TAGS`, `MODELS_META`).
- `@appe/core` is wired up twice and both must stay in step: as an npm workspace
  (root `workspaces: ["packages/*"]`) and as an explicit alias in
  `vite.config.ts`, `vitest.config.ts` and the `paths` of `tsconfig.json` /
  `tsconfig.app.json`. Its `exports` point at TS **source** on purpose — every
  consumer is TypeScript behind a bundler, so there is no build step to drift.
- Form/state: `react-hook-form` context under `src/contexts/form/`; shareable
  config is (de)serialized in `src/lib/urlConfig.ts` — add new `AppData` fields
  there too (it's a `Record<keyof AppData, …>`).
- Results table (`src/components/ResultsTableFiltered.tsx`) caps rendered rows at
  100 (the catalogue is thousands) with a "refine filters" note.

When adding a new data type or `Model`/`AppData` field, update: the type
(`packages/core/src/types/`), both functions in `packages/core/src/computations.ts`,
`types/results.ts`, then re-export it from `packages/core/src/index.ts` if it is
new — and in the app: `src/lib/urlConfig.ts`, the form (`SentenceInput` + a
popover), and `TokenSummary`/`TokenBreakdownPopover`.
