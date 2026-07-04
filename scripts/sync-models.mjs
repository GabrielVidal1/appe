#!/usr/bin/env node
// sync-models.mjs — pull the model catalogue from models.dev and regenerate the
// app's local JSON "database" (src/data/models.json + provider_data.json).
//
// models.dev exposes a single public endpoint, https://models.dev/api.json, an
// object keyed by provider id, each with a `models` map. We flatten every
// provider's models into the flat `Model[]` shape the app already consumes, so
// the rest of the app is unchanged except that `Provider` is now an open string.
//
// Run:  node scripts/sync-models.mjs
// A daily cron (scripts/sync-and-deploy.sh) runs this, rebuilds and redeploys.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "src", "data");
const API_URL = "https://models.dev/api.json";

// Only these input modalities are estimable by the app today (text prompt,
// image-by-pixels, pdf-by-page). Models that need audio/video input are dropped
// so cost estimates stay honest (per the "exclude other modalities" decision).
const SUPPORTED_INPUT = new Set(["text", "image", "pdf"]);

// Per-provider knobs the app needs but models.dev does not carry. PDF token/page
// and batch discounts are provider policy, not model metadata. Unlisted
// providers fall back to sensible defaults (see below) — this is the
// "use a default when not known" path for pdf/image estimation.
const PROVIDER_OVERRIDES = {
  anthropic: { pdf: { tokenPerPage: 2333 } },
  mistral: { pdf: { pricePerKPage: 1 } },
  // openai has no page-based pdf pricing; it bills pdf pages as image+text tokens.
};
const DEFAULT_BATCH_DISCOUNT = 0.5; // most first-party providers offer 50% batch.

/** Rough small/medium/big tier from blended $/Mtok — models.dev has no tier. */
function deriveTier(inputCost, outputCost) {
  const blended = (Number(inputCost) || 0) * 0.75 + (Number(outputCost) || 0) * 0.25;
  if (blended < 1) return "small";
  if (blended < 8) return "medium";
  return "big";
}

/** Capability tags the UI filters on, derived from models.dev boolean flags. */
function deriveTags(m, inputs) {
  const tags = [];
  if (inputs.includes("image")) tags.push("vision");
  if (m.reasoning) tags.push("reasoning");
  if (m.tool_call) tags.push("tools");
  if (m.open_weights) tags.push("opensource");
  return tags;
}

function mapModel(providerId, m) {
  const inputs = (m.modalities?.input ?? []).filter((x) => SUPPORTED_INPUT.has(x));
  const cost = m.cost ?? {};
  const inputCost = Number(cost.input) || 0;
  const outputCost = Number(cost.output) || 0;
  return {
    // Composite id: the same base model appears under many providers (openai,
    // openrouter, requesty…) at different prices, so plain ids collide.
    id: `${providerId}/${m.id}`,
    provider: providerId,
    name: m.name ?? m.id,
    version: m.release_date ?? "",
    task: inputs, // always includes "text" (guaranteed by the filter below)
    description: m.description ?? "",
    model_size: null, // models.dev does not expose parameter counts
    input_cost: inputCost,
    output_cost: outputCost,
    cache_cost: cost.cache_read != null ? Number(cost.cache_read) : null,
    max_token: m.limit?.context ?? null,
    tier: deriveTier(inputCost, outputCost),
    tags: deriveTags(m, inputs),
    license: m.open_weights ? "opensource" : "commercial",
  };
}

/** A model is estimable iff it takes text input, needs no unsupported modality,
 *  and carries a cost object (a price estimator can't price an unknown cost). */
function isEstimable(m) {
  const input = m.modalities?.input ?? [];
  if (!input.includes("text")) return false;
  if (!input.every((x) => SUPPORTED_INPUT.has(x))) return false;
  if (!m.cost || (m.cost.input == null && m.cost.output == null)) return false;
  return true;
}

async function main() {
  process.stdout.write(`Fetching ${API_URL} …\n`);
  const res = await fetch(API_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`models.dev returned HTTP ${res.status}`);
  const api = await res.json();

  const models = [];
  const providers = {};

  for (const [providerId, provider] of Object.entries(api)) {
    const kept = Object.values(provider.models ?? {}).filter(isEstimable);
    if (kept.length === 0) continue;

    for (const m of kept) models.push(mapModel(providerId, m));

    const override = PROVIDER_OVERRIDES[providerId] ?? {};
    providers[providerId] = {
      name: provider.name ?? providerId,
      batchDiscount: DEFAULT_BATCH_DISCOUNT,
      ...override,
    };
  }

  // Stable ordering: provider, then price, then name — deterministic diffs.
  models.sort(
    (a, b) =>
      a.provider.localeCompare(b.provider) ||
      a.input_cost - b.input_cost ||
      a.name.localeCompare(b.name)
  );

  const meta = {
    source: API_URL,
    generatedAt: new Date().toISOString(),
    providerCount: Object.keys(providers).length,
    modelCount: models.length,
  };

  await writeFile(join(DATA_DIR, "models.json"), JSON.stringify(models, null, 2) + "\n");
  await writeFile(
    join(DATA_DIR, "provider_data.json"),
    JSON.stringify(providers, null, 2) + "\n"
  );
  await writeFile(join(DATA_DIR, "models.meta.json"), JSON.stringify(meta, null, 2) + "\n");

  process.stdout.write(
    `✓ Wrote ${models.length} models from ${meta.providerCount} providers to src/data/\n`
  );
}

main().catch((err) => {
  console.error("sync-models failed:", err.message);
  process.exit(1);
});
