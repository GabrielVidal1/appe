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

- `src/data/models.json` — flat `Model[]` of every estimable model (~4.9k across
  ~144 providers). One entry per provider×model (the same base model appears
  under many providers at different prices — that's intentional for comparison).
- `src/data/provider_data.json` — per-provider display name, batch discount, and
  known PDF pricing knobs.
- `src/data/models.meta.json` — `{ source, generatedAt, providerCount,
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
node scripts/sync-models.mjs    # refresh model + logo data from models.dev
npm run build                   # type-checked production build
npm run deploy                  # build + deploy to zipgo (scripts/deploy.sh)
npx tsc --noEmit -p tsconfig.app.json   # typecheck
```

## Architecture pointers

- Estimation math: `src/lib/computations.ts` (tokens + prices), `src/lib/imageCost.ts`,
  `src/lib/tokenization/`. A data type (`prompts|images|pdfs|audio`) drives which
  input tokens are computed.
- Data access + derived lists: `src/data/index.ts` (`ALL_MODELS`, `ALL_TEXT_MODELS`,
  `ALL_PROVIDERS`, `ALL_TAGS`, `MODELS_META`).
- Form/state: `react-hook-form` context under `src/contexts/form/`; shareable
  config is (de)serialized in `src/lib/urlConfig.ts` — add new `AppData` fields
  there too (it's a `Record<keyof AppData, …>`).
- Results table (`src/components/ResultsTableFiltered.tsx`) caps rendered rows at
  100 (the catalogue is thousands) with a "refine filters" note.

When adding a new data type or `Model`/`AppData` field, update: the type, both
functions in `computations.ts`, `results.ts`, `urlConfig.ts`, the form
(`SentenceInput` + a popover), and `TokenSummary`/`TokenBreakdownPopover`.
