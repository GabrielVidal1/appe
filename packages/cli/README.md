# `appe` — what will this AI task cost?

The APPE estimator as a command. Describe a task in plain words, say how many
times you will run it, get a ranked cost table across every model in the
[models.dev](https://models.dev) catalogue.

Same catalogue, same tokenizer, same pricing maths as the web app at
[appe.dev.gabvdl.xyz](https://appe.dev.gabvdl.xyz) — both import
[`@appe/core`](../core), so the two cannot drift. No account, no telemetry, no
network call at runtime: the prices are baked in at build time.

```console
$ appe estimate "summarise a customer support ticket into two sentences" --count 10000

Task  summarise a customer support ticket into two sentences
Each item  14 input + 500 output tokens  (output assumed — set --output-tokens or --output)
Run  10,000 items  ·  5,140,000 tokens total  (~5 book series (10 books each))

#  MODEL                          PROVIDER  TIER   $/MTOK IN  $/MTOK OUT  COST/ITEM  TOTAL × 10,000
1  Voxtral Small 24B              evroc     small      0.002       0.002  $0.000001         $0.0118
2  Meta Llama Prompt Guard 2 22M  helicone  small      0.010       0.010  $0.000005         $0.0514
3  Llama 3.2 1B Instruct          inference small      0.010       0.010  $0.000005         $0.0514
…

Ranked 4,737 of 5,260 models · 523 with no output price hidden (--include-free)
Cheapest Voxtral Small 24B at $0.0118 · dearest o1-pro at $3,021 · spread ×255,541
```

## Install

Not yet on npm. From a checkout of the repo:

```bash
npm install          # once, at the repo root
npm run build:cli    # bundles packages/cli -> packages/cli/dist/appe.js
npx appe --help      # the workspace links the `appe` bin
```

## Usage

```
appe estimate <task> [options]
```

| Option | |
| --- | --- |
| `-t, --task <text>` | The task, in plain words. Also accepted as a positional. |
| `-f, --file <path>` | Read the task from a file. `-` (or a bare pipe) reads stdin. |
| `-n, --count <n>` | How many items you will run it on. Accepts `10k`, `1e6`, `1_000`. Default `1000`. |
| `-o, --output <text>` | A sample of the expected output; tokenized to get the output cost. |
| `--output-tokens <n>` | Output tokens per item. Wins over `--output`. Default `500`. |
| `-p, --provider <id>` | Only these providers. Repeatable or comma-separated. |
| `--tag <tag>` | Only models carrying **any** of these tags (`reasoning`, `tools`, `vision`, …). |
| `--tier <tier>` | Only these tiers: `small`, `medium`, `big`. |
| `--top <n>` | Rows to print. Default `20`. |
| `-b, --batch` | Apply each provider's batch-API discount. |
| `--include-free` | Include models with no output price (see below). |
| `-j, --json` | Machine-readable output, for pipelines. |

### Output tokens are the thing to get right

On most workloads the bill is dominated by output, not input. With neither
`--output` nor `--output-tokens`, the CLI assumes **500 output tokens per item**
and says so in the header — an estimate built on a guess is labelled as one.

### Models with no output price are hidden

523 catalogue entries price output at `$0` — embedders and rerankers (they emit
a vector, not tokens) and free/promo endpoints on aggregator gateways. Sorting
ascending by cost would fill every row with them: technically true, entirely
useless. They are hidden by default; `--include-free` brings them back. This is
a display rule only — the maths is untouched.

### The task can come from a file or a pipe

The task doesn't have to be a command-line argument — so a real prompt, a system
prompt or a whole document composes without shell-quoting it. An inline `--task`
always wins; otherwise the task is read from `--file`, then from stdin:

```bash
cat system-prompt.md | appe estimate --tier small   # piped in
appe estimate -f ./system-prompt.txt --count 50000   # from a file
appe estimate -f - < ./ticket.txt                    # explicit stdin
```

## Pipelines

`--json` prints the run, the filters, the catalogue provenance and the ranked
results:

```bash
# cheapest model that can do the job, as a single string
appe estimate "classify a review" -n 1e6 --tier small --json \
  | jq -r '.results[0] | "\(.provider)/\(.name) — $\(.totalCost)"'

# what a million classifications cost on Anthropic, batched
appe estimate "classify a review" -n 1e6 -p anthropic --batch --json | jq '.results[0].totalCost'
```

## Development

```bash
npm run build --workspace=appe      # bundle with esbuild
npm run typecheck --workspace=appe  # tsc
npm test                            # vitest, from the repo root
```

`@appe/core` exports TypeScript **source** (every other consumer is behind a
bundler). The CLI is therefore the one place that compiles it: esbuild inlines
core, its dependencies and the models.dev JSON into a single dependency-free
`dist/appe.js`.

MIT.
