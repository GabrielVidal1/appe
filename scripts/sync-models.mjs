#!/usr/bin/env node
// sync-models.mjs — pull the model catalogue from models.dev and regenerate the
// core package's local JSON "database" (packages/core/src/data/models.json +
// provider_data.json), which the web app and the CLI both read.
//
// models.dev exposes a single public endpoint, https://models.dev/api.json, an
// object keyed by provider id, each with a `models` map. We flatten every
// provider's models into the flat `Model[]` shape the app already consumes, so
// the rest of the app is unchanged except that `Provider` is now an open string.
//
// Run:  node scripts/sync-models.mjs
// A daily cron (scripts/sync-and-deploy.sh) runs this, rebuilds and redeploys.

import { writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "packages", "core", "src", "data");
const LOGO_DIR = join(__dirname, "..", "public", "logos");
const API_URL = "https://models.dev/api.json";
// models.dev serves a per-provider logo (SVG) at this path. Some are monochrome
// `currentColor` svgs, some are full-colour brand marks — the app inlines them
// so both render correctly (see components/ProviderIcons.tsx).
const LOGO_URL = (id) => `https://models.dev/logos/${id}.svg`;
const UA = { "user-agent": "appe-sync (+https://appe.dev.gabvdl.xyz)" };

// Input modalities the app knows how to price: text (prompt), image (pixels),
// pdf (pages), audio (duration). Video is kept so multimodal models (Gemini,
// Qwen-Omni…) are included, but its input is not separately estimated yet.
const SUPPORTED_INPUT = new Set(["text", "image", "pdf", "audio", "video"]);

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
  if (inputs.includes("audio")) tags.push("audio");
  if (inputs.includes("video")) tags.push("video");
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
    // Dedicated audio-input $/Mtok when models.dev provides it; otherwise the
    // estimator falls back to the regular input_cost (the "default when not
    // known" path for audio).
    input_audio_cost: cost.input_audio != null ? Number(cost.input_audio) : null,
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

/** Fetch a provider's SVG logo. Returns sanitised svg text, or null on any
 *  failure (the app then falls back to a generic icon). */
async function fetchLogo(id) {
  try {
    const res = await fetch(LOGO_URL(id), { headers: UA });
    if (!res.ok) return null;
    const svg = await res.text();
    if (!svg.includes("<svg")) return null;
    // Defensive: drop any scripting even though models.dev logos are clean —
    // these are inlined via dangerouslySetInnerHTML.
    if (/<script/i.test(svg)) return null;
    return svg.trim();
  } catch {
    return null;
  }
}

/** Download every provider logo into public/logos/<id>.svg (rebuilt each run). */
async function syncLogos(ids) {
  await rm(LOGO_DIR, { recursive: true, force: true });
  await mkdir(LOGO_DIR, { recursive: true });
  let ok = 0;
  await Promise.all(
    ids.map(async (id) => {
      const svg = await fetchLogo(id);
      if (svg) {
        await writeFile(join(LOGO_DIR, `${id}.svg`), svg + "\n");
        ok++;
      }
    })
  );
  return ok;
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

  const logoCount = await syncLogos(Object.keys(providers));

  const meta = {
    source: API_URL,
    generatedAt: new Date().toISOString(),
    providerCount: Object.keys(providers).length,
    modelCount: models.length,
    logoCount,
  };

  await writeFile(join(DATA_DIR, "models.json"), JSON.stringify(models, null, 2) + "\n");
  await writeFile(
    join(DATA_DIR, "provider_data.json"),
    JSON.stringify(providers, null, 2) + "\n"
  );
  await writeFile(join(DATA_DIR, "models.meta.json"), JSON.stringify(meta, null, 2) + "\n");

  process.stdout.write(
    `✓ Wrote ${models.length} models from ${meta.providerCount} providers to packages/core/src/data/\n` +
      `✓ Downloaded ${logoCount}/${meta.providerCount} provider logos to public/logos/\n`
  );
}

main().catch((err) => {
  console.error("sync-models failed:", err.message);
  process.exit(1);
});
