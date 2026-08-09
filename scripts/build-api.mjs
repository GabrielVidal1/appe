#!/usr/bin/env node
/**
 * build-api.mjs — publish the model catalogue as a static JSON API.
 *
 * APPE already owns the homelab's model data (synced daily from models.dev by
 * `sync-models.mjs`), but until now it was only reachable by *importing*
 * `@appe/core` — which means only APPE itself could read it. Other homelab apps
 * want the same numbers (the ai-agent's composer lists every OpenRouter model
 * with its $/Mtok and parameter size, and prices pi.dev sessions off these
 * rates), and the one thing they must not do is keep a second copy of the
 * prices.
 *
 * So this writes the catalogue into `public/`, which Vite copies verbatim into
 * `dist/` and zipgo then serves:
 *
 *   /api/index.json              meta + provider list (id, name, model count)
 *   /api/models/<provider>.json  every model of one provider
 *
 * Per-provider slices, not one big file: the whole catalogue is ~2.5 MB, while
 * the slice a consumer actually wants (openrouter) is ~110 KB.
 *
 * Each entry is the `Model` shape from `@appe/core` verbatim, plus one derived
 * field — `api_id`, the id **without** the provider prefix, i.e. what you pass
 * to that provider's API (`openrouter/qwen/qwen3-coder` → `qwen/qwen3-coder`).
 * The prefixed `id` stays because the same base model exists under many
 * providers at different prices.
 *
 * Runs from `npm run build` (as `prebuild`), so `public/api` is generated, never
 * committed — `sync-models.mjs` refreshes the source data, this reshapes it.
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "packages/core/src/data");
const OUT_DIR = join(ROOT, "public/api");

const read = async (name) => JSON.parse(await readFile(join(DATA_DIR, name), "utf8"));

async function main() {
  const [models, providerData, meta] = await Promise.all([
    read("models.json"),
    read("provider_data.json"),
    read("models.meta.json"),
  ]);

  // Fresh tree: a provider that disappears upstream must not linger as a stale
  // slice from a previous build.
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(join(OUT_DIR, "models"), { recursive: true });

  const byProvider = new Map();
  for (const m of models) {
    const list = byProvider.get(m.provider) ?? [];
    list.push({ ...m, api_id: m.id.slice(m.provider.length + 1) });
    byProvider.set(m.provider, list);
  }

  for (const [provider, list] of byProvider) {
    await writeFile(
      join(OUT_DIR, "models", `${provider}.json`),
      JSON.stringify({
        provider,
        name: providerData[provider]?.name ?? provider,
        generatedAt: meta.generatedAt,
        source: meta.source,
        count: list.length,
        models: list,
      })
    );
  }

  const providers = [...byProvider.entries()]
    .map(([id, list]) => ({
      id,
      name: providerData[id]?.name ?? id,
      count: list.length,
      url: `/api/models/${id}.json`,
    }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

  await writeFile(
    join(OUT_DIR, "index.json"),
    JSON.stringify({ ...meta, providers })
  );

  process.stdout.write(
    `✓ API: ${models.length} models across ${providers.length} providers → public/api/\n`
  );
}

main().catch((err) => {
  console.error("build-api failed:", err.message);
  process.exit(1);
});
