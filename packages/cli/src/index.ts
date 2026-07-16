/**
 * appe — estimate what an AI task costs, from the terminal.
 *
 * The catalogue and the maths are `@appe/core`, shared verbatim with the web
 * app at https://appe.dev.gabvdl.xyz. No network, no account, no telemetry:
 * the model prices are baked in at build time from models.dev.
 */

import { parseArgs } from "node:util";

import { ALL_PROVIDERS, ALL_TAGS, ALL_TIERS, MODELS_META } from "@appe/core";

import {
  ASSUMED_OUTPUT_TOKENS,
  renderJson,
  renderTable,
  runEstimate,
  type EstimateOptions,
} from "./estimate";
import { bold, dim, red } from "./format";
import { pickTaskSource, readTask, TaskReadError } from "./input";
import {
  renderModelsJson,
  renderModelsTable,
  runModels,
  SORT_KEYS,
  type ModelsOptions,
  type SortKey,
} from "./models";

const VERSION = "0.1.0";

const HELP = `
${bold("appe")} — what will this AI task cost?

${bold("USAGE")}
  appe estimate <task> [options]      price a task across every model
  appe models [query] [options]       browse / search the model catalogue

${bold("ESTIMATE OPTIONS")}
  -t, --task <text>       The task, in plain words ("summarise a support ticket")
  -f, --file <path>       Read the task from a file (use "-" for stdin)
  -n, --count <n>         How many items you will run it on            [default: 1000]
  -o, --output <text>     A sample of the expected output, tokenized for output cost
      --output-tokens <n> Output tokens per item; wins over --output   [default: ${ASSUMED_OUTPUT_TOKENS}]
  -b, --batch             Apply each provider's batch-API discount
      --include-free      Include models with no output price (embedders, free tiers)

${bold("MODELS OPTIONS")}
  -q, --query <text>      Search name / id / provider (also accepted as a positional)
      --max-cost <n>      Only models billing ≤ $n /Mtok on both input and output
      --sort <key>        cost | input | output | context | name | provider  [default: cost]

${bold("SHARED OPTIONS")}
  -p, --provider <id>     Only these providers (repeatable, or comma-separated)
      --tag <tag>         Only models with any of these tags (repeatable/comma-separated)
      --tier <tier>       Only these tiers: small | medium | big
      --top <n>           How many rows to print       [estimate: 20 · models: 30]
  -j, --json              Machine-readable output, for pipelines
  -h, --help              Show this help
  -v, --version           Show the version

${bold("EXAMPLES")}
  appe estimate "summarise a customer support ticket" --count 10000
  appe estimate "classify a review as positive or negative" -n 1e6 --tier small
  appe estimate "answer a question about a PDF" -p anthropic,openai --top 5
  appe estimate "write a unit test" --tag reasoning --json | jq '.results[0]'
  cat prompt.md | appe estimate --tier small          # task piped in from stdin
  appe models claude --provider anthropic             # search the catalogue
  appe models --tag reasoning --max-cost 1 --sort context   # cheap reasoners
  appe models "gpt" --json | jq '.results[].id'       # ids for a pipeline

${bold("NOTES")}
  Output tokens dominate most bills. Pass --output-tokens (or a real --output
  sample) — the ${ASSUMED_OUTPUT_TOKENS}-token default is a guess, and it is flagged as one.

  ${dim(`Prices: ${MODELS_META.source}, synced ${MODELS_META.generatedAt.slice(0, 10)} · ${MODELS_META.modelCount.toLocaleString("en-US")} models · web: appe.dev.gabvdl.xyz`)}
`;

const fail = (message: string, hint?: string): never => {
  process.stderr.write(`${red("error")} ${message}\n`);
  if (hint) process.stderr.write(`${dim(hint)}\n`);
  process.exit(1);
};

/** Accept both `--tag a --tag b` and `--tag a,b`. */
const list = (values: string[] | undefined): string[] =>
  (values ?? [])
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);

/** Accept `1000`, `1_000`, `1e6` and `10k`. */
const number = (raw: string | undefined, flag: string, fallback: number): number => {
  if (raw === undefined) return fallback;
  const cleaned = raw.replace(/[_,\s]/g, "");
  const scaled = /^([\d.]+(?:e[+-]?\d+)?)([kmb])$/i.exec(cleaned);
  const n = scaled
    ? Number(scaled[1]) * { k: 1e3, m: 1e6, b: 1e9 }[scaled[2].toLowerCase()]
    : Number(cleaned);

  if (!Number.isFinite(n) || n <= 0) {
    fail(`${flag} must be a positive number (got "${raw}").`);
  }
  return n;
};

const main = () => {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        task: { type: "string", short: "t" },
        file: { type: "string", short: "f" },
        count: { type: "string", short: "n" },
        output: { type: "string", short: "o" },
        "output-tokens": { type: "string" },
        query: { type: "string", short: "q" },
        provider: { type: "string", short: "p", multiple: true },
        tag: { type: "string", multiple: true },
        tier: { type: "string", multiple: true },
        "max-cost": { type: "string" },
        sort: { type: "string" },
        top: { type: "string" },
        batch: { type: "boolean", short: "b", default: false },
        "include-free": { type: "boolean", default: false },
        json: { type: "boolean", short: "j", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (e) {
    return fail((e as Error).message, "Run `appe --help` for usage.");
  }

  const { values, positionals } = parsed;

  // Provider / tag / tier filters are shared by `estimate` and `models`; both
  // fail loudly on a typo'd value rather than silently returning nothing.
  const parseFilters = () => {
    const providers = list(values.provider as string[]);
    const tags = list(values.tag as string[]);
    const tiers = list(values.tier as string[]);

    const unknownProvider = providers.find((p) => !ALL_PROVIDERS.includes(p));
    if (unknownProvider) {
      fail(
        `unknown provider "${unknownProvider}".`,
        `Known providers include: ${ALL_PROVIDERS.slice(0, 12).join(", ")}, … (${ALL_PROVIDERS.length} total)`
      );
    }
    const unknownTag = tags.find((t) => !ALL_TAGS.includes(t));
    if (unknownTag) {
      fail(`unknown tag "${unknownTag}".`, `Known tags: ${ALL_TAGS.join(", ")}`);
    }
    // ALL_TIERS is ModelSize[]; the user hands us free-form strings.
    const unknownTier = tiers.find((t) => !(ALL_TIERS as string[]).includes(t));
    if (unknownTier) {
      fail(`unknown tier "${unknownTier}".`, `Known tiers: ${ALL_TIERS.join(", ")}`);
    }
    return { providers, tags, tiers };
  };

  if (values.version) {
    process.stdout.write(`appe ${VERSION}\n`);
    return;
  }

  const [command, ...rest] = positionals;

  if (values.help || !command) {
    process.stdout.write(`${HELP}\n`);
    return;
  }

  // `appe models` — browse/search the catalogue, no task, no token maths.
  if (command === "models") {
    const { providers, tags, tiers } = parseFilters();
    const query = ((values.query as string) ?? rest.join(" ")).trim();

    const sortRaw = (values.sort as string) ?? "cost";
    if (!(SORT_KEYS as readonly string[]).includes(sortRaw)) {
      return fail(`unknown --sort "${sortRaw}".`, `Sort by: ${SORT_KEYS.join(", ")}`);
    }

    const modelsOptions: ModelsOptions = {
      query,
      providers,
      tags,
      tiers,
      maxCost:
        values["max-cost"] === undefined
          ? undefined
          : number(values["max-cost"] as string, "--max-cost", Infinity),
      sort: sortRaw as SortKey,
      top: number(values.top as string, "--top", 30),
      json: Boolean(values.json),
    };

    const modelsResult = runModels(modelsOptions);
    process.stdout.write(
      modelsOptions.json
        ? `${renderModelsJson(modelsOptions, modelsResult)}\n`
        : `${renderModelsTable(modelsOptions, modelsResult)}\n`
    );
    return;
  }

  if (command !== "estimate") {
    return fail(
      `unknown command "${command}".`,
      "Commands: `appe estimate`, `appe models`. Run `appe --help`."
    );
  }

  // `appe estimate "the task"` is the same as `--task "the task"`. Failing that,
  // the task can come from a file (`-f`) or a pipe (bare stdin, or `-f -`), so
  // the CLI composes: `cat ticket.txt | appe estimate`.
  const inline = (values.task as string) ?? rest.join(" ");
  const source = pickTaskSource({
    inline,
    file: values.file as string | undefined,
    stdinPiped: !process.stdin.isTTY,
  });

  let task: string | null;
  try {
    task = readTask(source);
  } catch (e) {
    if (e instanceof TaskReadError) {
      return fail(`could not read task from "${e.path}".`, e.cause.message);
    }
    throw e;
  }

  if (task === null || !task.trim()) {
    return fail(
      source.kind === "none" ? "no task given." : "the task is empty.",
      'Describe the work inline, from a file, or on stdin:\n' +
        '  appe estimate "summarise a support ticket" --count 10000\n' +
        "  cat ticket.txt | appe estimate"
    );
  }

  const { providers, tags, tiers } = parseFilters();

  const outputSample = values.output as string | undefined;
  const explicitOutputTokens = values["output-tokens"] !== undefined;
  const options: EstimateOptions = {
    task: task.trim(),
    count: number(values.count as string, "--count", 1000),
    outputSample,
    // An explicit --output-tokens always wins. With neither flag we assume a
    // default rather than silently pricing a zero-token answer.
    outputTokens: explicitOutputTokens
      ? number(values["output-tokens"] as string, "--output-tokens", ASSUMED_OUTPUT_TOKENS)
      : outputSample
        ? undefined
        : ASSUMED_OUTPUT_TOKENS,
    outputAssumed: !explicitOutputTokens && !outputSample,
    providers,
    tags,
    tiers,
    top: number(values.top as string, "--top", 20),
    batch: Boolean(values.batch),
    includeFree: Boolean(values["include-free"]),
    json: Boolean(values.json),
  };

  const result = runEstimate(options);

  process.stdout.write(
    options.json
      ? `${renderJson(options, result)}\n`
      : `${renderTable(options, result)}\n`
  );
};

main();
