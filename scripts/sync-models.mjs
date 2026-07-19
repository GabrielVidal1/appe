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

// --- Speed / duration data ------------------------------------------------
// models.dev carries NO speed data. The wall-clock estimator (packages/core/
// speed.ts) needs output tokens/sec + time-to-first-token per model. Those come
// from the Artificial Analysis free API when an API key is available; otherwise
// every model gets a coarse tier-based fallback so the feature still works.
//
//   AA_API_KEY=<key> node scripts/sync-models.mjs   → measured speeds where AA
//                                                      benchmarks the model
//   node scripts/sync-models.mjs                     → tier-estimated speeds
//
// Get a free key (100 req/day) at https://artificialanalysis.ai/ (Insights
// Platform → API keys). Attribution to artificialanalysis.ai is required by the
// free tier and is shown in the UI when speed_source === "measured".
const AA_API_KEY = process.env.AA_API_KEY || "";
const AA_URL = "https://artificialanalysis.ai/api/v2/language/models/free";

// Tier → fallback tokens/sec and TTFT (mirror of TIER_FALLBACK_* in speed.ts;
// kept in sync so the baked JSON is self-describing and speed.ts's fallback is a
// belt-and-braces default). small≈fast … big≈slow.
const TIER_TPS = { small: 120, medium: 70, big: 45 };
const TIER_TTFT = { small: 0.3, medium: 0.5, big: 0.8 };

/** Rough small/medium/big tier from blended $/Mtok — models.dev has no tier. */
function deriveTier(inputCost, outputCost) {
  const blended = (Number(inputCost) || 0) * 0.75 + (Number(outputCost) || 0) * 0.25;
  if (blended < 1) return "small";
  if (blended < 8) return "medium";
  return "big";
}

/** Normalise a name/id/slug for fuzzy matching AA models to models.dev models:
 *  lowercase, strip everything but alphanumerics. "GPT-4o mini" → "gpt4omini". */
function speedKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Fetch the Artificial Analysis free benchmark and build a lookup of
 * normalised-slug → { tps, ttft }. Returns an empty Map (no key, error, or rate
 * limit) rather than throwing — the sync must never fail over optional speed
 * data; models then fall back to tier estimates.
 */
async function fetchSpeedIndex() {
  const index = new Map();
  if (!AA_API_KEY) {
    process.stdout.write(
      "· No AA_API_KEY set — using tier-estimated model speeds.\n"
    );
    return index;
  }
  try {
    const res = await fetch(AA_URL, {
      headers: { "x-api-key": AA_API_KEY, accept: "application/json", ...UA },
    });
    if (!res.ok) {
      process.stdout.write(
        `· Artificial Analysis returned HTTP ${res.status} — falling back to tier estimates.\n`
      );
      return index;
    }
    const body = await res.json();
    // The endpoint returns { data: [ …models… ] } (or a bare array on older
    // shapes). Be liberal about the envelope.
    const rows = Array.isArray(body) ? body : body.data ?? body.models ?? [];
    for (const m of rows) {
      const tps = Number(m.median_output_tokens_per_second);
      const ttft = Number(m.median_time_to_first_token_seconds);
      if (!(tps > 0)) continue;
      const entry = { tps, ttft: ttft >= 0 ? ttft : null };
      // Index under several keys so models.dev ids can match on any of them.
      for (const k of [m.slug, m.id, m.name]) {
        const key = speedKey(k);
        if (key && !index.has(key)) index.set(key, entry);
      }
    }
    process.stdout.write(
      `· Artificial Analysis: ${index.size} benchmarked speed entries.\n`
    );
  } catch (err) {
    process.stdout.write(
      `· Artificial Analysis fetch failed (${err.message}) — using tier estimates.\n`
    );
  }
  return index;
}

/** Resolve a model's speed: measured from AA if we can match it, else tier
 *  fallback. `bareId` is the models.dev model id without the provider prefix. */
function resolveSpeed(speedIndex, bareId, name, tier) {
  const hit =
    speedIndex.get(speedKey(bareId)) || speedIndex.get(speedKey(name)) || null;
  if (hit) {
    return {
      speed_tps: hit.tps,
      ttft_s: hit.ttft ?? TIER_TTFT[tier],
      speed_source: "measured",
    };
  }
  return {
    speed_tps: TIER_TPS[tier],
    ttft_s: TIER_TTFT[tier],
    speed_source: "estimated",
  };
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

function mapModel(providerId, m, speedIndex) {
  const inputs = (m.modalities?.input ?? []).filter((x) => SUPPORTED_INPUT.has(x));
  const cost = m.cost ?? {};
  const inputCost = Number(cost.input) || 0;
  const outputCost = Number(cost.output) || 0;
  const tier = deriveTier(inputCost, outputCost);
  const speed = resolveSpeed(speedIndex, m.id, m.name ?? m.id, tier);
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
    tier,
    tags: deriveTags(m, inputs),
    license: m.open_weights ? "opensource" : "commercial",
    // Wall-clock speed: measured (Artificial Analysis) when matched, else a
    // tier-based estimate. Drives the duration column in the app.
    speed_tps: speed.speed_tps,
    ttft_s: speed.ttft_s,
    speed_source: speed.speed_source,
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

  // Optional speed benchmark (Artificial Analysis). Empty when no key / offline.
  const speedIndex = await fetchSpeedIndex();

  const models = [];
  const providers = {};

  for (const [providerId, provider] of Object.entries(api)) {
    const kept = Object.values(provider.models ?? {}).filter(isEstimable);
    if (kept.length === 0) continue;

    for (const m of kept) models.push(mapModel(providerId, m, speedIndex));

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

  const measuredSpeedCount = models.filter(
    (m) => m.speed_source === "measured"
  ).length;

  const meta = {
    source: API_URL,
    generatedAt: new Date().toISOString(),
    providerCount: Object.keys(providers).length,
    modelCount: models.length,
    logoCount,
    // Provenance for the speed/duration feature.
    speedSource: AA_API_KEY ? "artificial-analysis" : "tier-estimated",
    measuredSpeedCount,
  };

  await writeFile(join(DATA_DIR, "models.json"), JSON.stringify(models, null, 2) + "\n");
  await writeFile(
    join(DATA_DIR, "provider_data.json"),
    JSON.stringify(providers, null, 2) + "\n"
  );
  await writeFile(join(DATA_DIR, "models.meta.json"), JSON.stringify(meta, null, 2) + "\n");

  process.stdout.write(
    `✓ Wrote ${models.length} models from ${meta.providerCount} providers to packages/core/src/data/\n` +
      `✓ Downloaded ${logoCount}/${meta.providerCount} provider logos to public/logos/\n` +
      `✓ Speed: ${measuredSpeedCount} measured (AA), ${
        models.length - measuredSpeedCount
      } tier-estimated\n`
  );
}

main().catch((err) => {
  console.error("sync-models failed:", err.message);
  process.exit(1);
});
