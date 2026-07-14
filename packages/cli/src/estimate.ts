/**
 * `appe estimate` — describe a task, get a ranked cost table.
 *
 * Every number printed here is produced by `@appe/core` — the same catalogue,
 * the same tokenizer and the same pricing maths the web app runs. The CLI adds
 * filtering, ranking and presentation, and nothing else: if a figure here ever
 * disagrees with appe.dev.gabvdl.xyz for the same inputs, that is a bug.
 */

import {
  ALL_TEXT_MODELS,
  DEFAULT_APP_DATA,
  MODELS_META,
  computePrices,
  computeTokens,
  tokensToRealWorldText,
  type AppData,
  type Model,
  type PricingResult,
} from "@appe/core";

import { bold, cyan, dim, green, int, rate, table, usd, yellow } from "./format";

/** Output tokens assumed per item when the user describes no expected output. */
export const ASSUMED_OUTPUT_TOKENS = 500;

export type EstimateOptions = {
  task: string;
  count: number;
  /** A sample of the expected output; tokenized to get output tokens. */
  outputSample?: string;
  /** Explicit output-token count; wins over `outputSample` when both are given. */
  outputTokens?: number;
  /** True when nothing described the output and ASSUMED_OUTPUT_TOKENS was used. */
  outputAssumed: boolean;
  providers: string[];
  tags: string[];
  tiers: string[];
  top: number;
  batch: boolean;
  includeFree: boolean;
  json: boolean;
};

export type EstimateRow = PricingResult & { model: Model };

/** Provider / tier / tag filters, as the user asked for them. */
const matchesFilters = (model: Model, o: EstimateOptions): boolean => {
  if (o.providers.length && !o.providers.includes(model.provider)) return false;
  if (o.tiers.length && !o.tiers.includes(model.tier)) return false;
  // Same semantics as the web app's capability filter: a model matches when it
  // carries *any* of the requested tags.
  if (o.tags.length && !model.tags.some((t) => o.tags.includes(t))) return false;
  return true;
};

/**
 * Models the catalogue prices at nothing for output.
 *
 * Two kinds end up here, and neither belongs at the top of a cost ranking for a
 * generative task: embedders and rerankers (they emit a vector, not tokens — no
 * output price because there is no output), and free tiers / promo endpoints on
 * aggregator gateways. models.dev gives embedders no distinguishing tag (their
 * `task` is `["text"]` and `tags` is often `[]`), so a zero output price is the
 * only signal there is.
 *
 * Sorting ascending by cost would otherwise fill every row with them at
 * $0.000001 — a technically true, entirely useless answer. Hidden by default,
 * `--include-free` brings them back. A display choice: the maths is untouched.
 */
const hasNoOutputPrice = (model: Model): boolean => model.output_cost === 0;

/**
 * Run the estimate. Returns the ranked rows (cheapest first) plus the token
 * profile of a single item, so both the table and the --json output can be
 * rendered from one computation.
 */
export const runEstimate = (o: EstimateOptions) => {
  const appData: AppData = {
    ...DEFAULT_APP_DATA,
    dataType: "prompts",
    prompt: o.task,
    example: o.outputSample ?? "",
    dataCount: o.count,
    batchEnabled: o.batch,
    selectedModels: [],
  };

  // An explicit --output-tokens replaces the tokenized sample. Patching the
  // TokenResults (rather than the AppData) keeps the pricing maths untouched:
  // computePrices consumes whatever token counts it is handed.
  const withOutputOverride = (t: ReturnType<typeof computeTokens>) =>
    o.outputTokens === undefined
      ? t
      : {
          ...t,
          outputTokens: o.outputTokens,
          totalTokens: t.inputTokens.total + o.outputTokens,
        };

  const matched = ALL_TEXT_MODELS.filter((m) => matchesFilters(m, o));
  const hiddenFree = o.includeFree ? 0 : matched.filter(hasNoOutputPrice).length;
  const candidates = o.includeFree
    ? matched
    : matched.filter((m) => !hasNoOutputPrice(m));

  const rows: EstimateRow[] = candidates
    .map((model) => {
      const tokens = withOutputOverride(computeTokens(appData, model));
      return { ...computePrices(appData, model, tokens), model } as EstimateRow;
    })
    .sort((a, b) => a.totalCost - b.totalCost);

  return { rows, candidates, hiddenFree, appData };
};

export const renderJson = (o: EstimateOptions, r: ReturnType<typeof runEstimate>) => {
  const shown = r.rows.slice(0, o.top);
  const first = r.rows[0];

  return JSON.stringify(
    {
      task: o.task,
      count: o.count,
      batch: o.batch,
      dataType: "prompts",
      outputTokensAssumed: o.outputAssumed,
      tokensPerItem: first
        ? {
            input: first.inputTokens.total,
            output: first.outputTokens,
            total: first.totalTokens,
          }
        : null,
      catalogue: {
        source: MODELS_META.source,
        generatedAt: MODELS_META.generatedAt,
        modelCount: MODELS_META.modelCount,
      },
      filters: {
        providers: o.providers,
        tags: o.tags,
        tiers: o.tiers,
        includeFree: o.includeFree,
      },
      modelsConsidered: r.candidates.length,
      currency: "USD",
      results: shown.map((row, i) => ({
        rank: i + 1,
        id: row.model.id,
        name: row.model.name,
        provider: row.model.provider,
        tier: row.model.tier,
        tags: row.model.tags,
        rates: {
          inputPerMTok: row.model.input_cost,
          outputPerMTok: row.model.output_cost,
          cachedInputPerMTok: row.model.cache_cost,
        },
        tokens: {
          input: row.inputTokens.total,
          output: row.outputTokens,
          total: row.totalTokens,
        },
        costPerItem: row.totalCost / o.count,
        totalCost: row.totalCost,
        inputCost: row.inputCost.text,
        outputCost: row.outputCost,
      })),
    },
    null,
    2
  );
};

export const renderTable = (
  o: EstimateOptions,
  r: ReturnType<typeof runEstimate>
): string => {
  const out: string[] = [];
  const shown = r.rows.slice(0, o.top);

  if (!shown.length) {
    return [
      yellow("No model matches those filters."),
      dim("Loosen --provider / --tag / --tier, or pass --include-free."),
    ].join("\n");
  }

  const sample = shown[0];
  const inTok = sample.inputTokens.total;
  const outTok = sample.outputTokens;

  // --- the task, restated, so the estimate is auditable at a glance ----------
  out.push("");
  out.push(`${bold("Task")}  ${o.task}`);
  out.push(
    `${bold("Each item")}  ${int(inTok)} input + ${int(outTok)} output tokens` +
      (o.outputAssumed
        ? dim("  (output assumed — set --output-tokens or --output)")
        : "")
  );
  out.push(
    `${bold("Run")}  ${int(o.count)} item${o.count === 1 ? "" : "s"}` +
      `  ${dim("·")}  ${int((inTok + outTok) * o.count)} tokens total` +
      `  ${dim(`(${tokensToRealWorldText((inTok + outTok) * o.count)})`)}` +
      (o.batch ? `  ${dim("·")}  ${cyan("batch pricing")}` : "")
  );
  out.push("");

  // --- the ranking ----------------------------------------------------------
  out.push(
    table(shown, [
      { header: "#", align: "right", value: (_r, i) => dim(String(i + 1)) },
      { header: "MODEL", max: 34, value: (row) => bold(row.model.name) },
      { header: "PROVIDER", max: 18, value: (row) => cyan(row.model.provider) },
      { header: "TIER", value: (row) => dim(row.model.tier) },
      {
        header: "$/MTOK IN",
        align: "right",
        value: (row) => rate(row.model.input_cost),
      },
      {
        header: "$/MTOK OUT",
        align: "right",
        value: (row) => rate(row.model.output_cost),
      },
      {
        header: "COST/ITEM",
        align: "right",
        value: (row) => usd(row.totalCost / o.count),
      },
      {
        header: `TOTAL × ${int(o.count)}`,
        align: "right",
        value: (row, i) => (i === 0 ? green(bold(usd(row.totalCost))) : usd(row.totalCost)),
      },
    ])
  );

  // --- what was compared, and what was left out -----------------------------
  const cheapest = r.rows[0];
  const dearest = r.rows[r.rows.length - 1];
  out.push("");
  out.push(
    dim(
      `Ranked ${int(r.rows.length)} of ${int(ALL_TEXT_MODELS.length)} models` +
        (shown.length < r.rows.length ? ` · showing top ${shown.length} (--top N)` : "") +
        (r.hiddenFree
          ? ` · ${int(r.hiddenFree)} with no output price hidden (embedders, free tiers — --include-free)`
          : "")
    )
  );
  if (r.rows.length > 1) {
    out.push(
      dim(
        `Cheapest ${cheapest.model.name} at ${usd(cheapest.totalCost)} · ` +
          `dearest ${dearest.model.name} at ${usd(dearest.totalCost)} · ` +
          `spread ×${
            cheapest.totalCost > 0
              ? Math.round(dearest.totalCost / cheapest.totalCost).toLocaleString("en-US")
              : "∞"
          }`
      )
    );
  }
  out.push(
    dim(`Prices from ${MODELS_META.source}, synced ${MODELS_META.generatedAt.slice(0, 10)}.`)
  );
  out.push("");

  return out.join("\n");
};
