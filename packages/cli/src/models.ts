/**
 * `appe models` — browse the model catalogue from the terminal.
 *
 * A sibling to `appe estimate`: where `estimate` prices one task across models,
 * `models` just lists the catalogue — search by name, filter by provider / tag /
 * tier / price, sorted however you like. No task, no token maths; it is a lens
 * on `@appe/core`'s `ALL_TEXT_MODELS`, the same daily-synced models.dev data the
 * web app browses at appe.dev.gabvdl.xyz.
 */

import { ALL_TEXT_MODELS, MODELS_META, type Model } from "@appe/core";

import { bold, cyan, dim, int, rate, table, yellow } from "./format";

/** Sort keys accepted by `--sort`; `cost` is the default. */
export const SORT_KEYS = [
  "cost",
  "input",
  "output",
  "context",
  "name",
  "provider",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type ModelsOptions = {
  /** Free-text query matched against name / id / provider (all words must hit). */
  query: string;
  providers: string[];
  tags: string[];
  tiers: string[];
  /** Cap: keep models whose input AND output $/Mtok are both ≤ this. */
  maxCost?: number;
  sort: SortKey;
  top: number;
  json: boolean;
};

/** Provider / tier / tag / price / text filters, as the user asked for them. */
const matchesFilters = (model: Model, o: ModelsOptions): boolean => {
  if (o.providers.length && !o.providers.includes(model.provider)) return false;
  if (o.tiers.length && !o.tiers.includes(model.tier)) return false;
  // Any-of tag semantics, matching `estimate` and the web app.
  if (o.tags.length && !model.tags.some((t) => o.tags.includes(t))) return false;
  // "--max-cost N" means nothing about this model bills over $N/Mtok, so both
  // sides are capped — a $0.10-in / $30-out model is not a "cheap" model.
  if (o.maxCost !== undefined && Math.max(model.input_cost, model.output_cost) > o.maxCost) {
    return false;
  }
  if (o.query) {
    const haystack = `${model.name} ${model.id} ${model.provider}`.toLowerCase();
    // Every whitespace-separated word must appear somewhere — forgiving, so
    // "claude haiku" finds it regardless of order.
    if (!o.query.toLowerCase().split(/\s+/).every((w) => haystack.includes(w))) {
      return false;
    }
  }
  return true;
};

const comparators: Record<SortKey, (a: Model, b: Model) => number> = {
  // Cheapest generation first: output rate, then input rate, then name.
  cost: (a, b) =>
    a.output_cost - b.output_cost || a.input_cost - b.input_cost || a.name.localeCompare(b.name),
  input: (a, b) => a.input_cost - b.input_cost || a.name.localeCompare(b.name),
  output: (a, b) => a.output_cost - b.output_cost || a.name.localeCompare(b.name),
  // Biggest context first (a null window sorts last).
  context: (a, b) => (b.max_token ?? -1) - (a.max_token ?? -1) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  provider: (a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name),
};

/**
 * Filter and sort the catalogue. Returns the full matched, sorted list (the
 * renderers slice to `--top`), plus the catalogue total for the footer.
 */
export const runModels = (o: ModelsOptions) => {
  const rows = ALL_TEXT_MODELS.filter((m) => matchesFilters(m, o)).sort(comparators[o.sort]);
  return { rows, total: ALL_TEXT_MODELS.length };
};

/** Compact context-window label: 200000 → "200k", 1000000 → "1M", null → "—". */
const context = (n: number | null): string => {
  if (n === null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

export const renderModelsJson = (o: ModelsOptions, r: ReturnType<typeof runModels>): string => {
  const shown = r.rows.slice(0, o.top);
  return JSON.stringify(
    {
      query: o.query || null,
      filters: {
        providers: o.providers,
        tags: o.tags,
        tiers: o.tiers,
        maxCost: o.maxCost ?? null,
      },
      sort: o.sort,
      catalogue: {
        source: MODELS_META.source,
        generatedAt: MODELS_META.generatedAt,
        modelCount: MODELS_META.modelCount,
      },
      matched: r.rows.length,
      currency: "USD",
      results: shown.map((m) => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        tier: m.tier,
        tags: m.tags,
        license: m.license,
        contextTokens: m.max_token,
        rates: {
          inputPerMTok: m.input_cost,
          outputPerMTok: m.output_cost,
          cachedInputPerMTok: m.cache_cost,
        },
      })),
    },
    null,
    2
  );
};

export const renderModelsTable = (
  o: ModelsOptions,
  r: ReturnType<typeof runModels>
): string => {
  const shown = r.rows.slice(0, o.top);

  if (!shown.length) {
    return [
      yellow("No model matches those filters."),
      dim("Loosen --query / --provider / --tag / --tier / --max-cost."),
    ].join("\n");
  }

  const out: string[] = [""];
  out.push(
    table(shown, [
      { header: "MODEL", max: 34, value: (m) => bold(m.name) },
      { header: "PROVIDER", max: 18, value: (m) => cyan(m.provider) },
      { header: "TIER", value: (m) => dim(m.tier) },
      { header: "$/MTOK IN", align: "right", value: (m) => rate(m.input_cost) },
      { header: "$/MTOK OUT", align: "right", value: (m) => rate(m.output_cost) },
      { header: "CONTEXT", align: "right", value: (m) => context(m.max_token) },
      { header: "TAGS", max: 30, value: (m) => dim(m.tags.join(" ")) },
    ])
  );

  out.push("");
  out.push(
    dim(
      `Matched ${int(r.rows.length)} of ${int(r.total)} models` +
        (shown.length < r.rows.length ? ` · showing top ${shown.length} (--top N)` : "") +
        ` · sorted by ${o.sort}`
    )
  );
  out.push(
    dim(`Prices from ${MODELS_META.source}, synced ${MODELS_META.generatedAt.slice(0, 10)}.`)
  );
  out.push("");

  return out.join("\n");
};
