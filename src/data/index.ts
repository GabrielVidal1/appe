import { Model } from "@/types/model";
import { keyBy } from "lodash";
import modelsData from "./models.json";
import meta from "./models.meta.json";

// The model catalogue is generated from models.dev by scripts/sync-models.mjs
// (refreshed daily). It is a flat array of every estimable model across all
// providers — see that script for the mapping.
export const ALL_MODELS = modelsData as Model[];

export const MODELS_META = meta as {
  source: string;
  generatedAt: string;
  providerCount: number;
  modelCount: number;
};

export const ALL_MODELS_BY_ID = keyBy(ALL_MODELS, (model) => model.id);

// Every synced model takes text input, so ALL_TEXT_MODELS is the full set today;
// the filter is kept so a future audio/video-only import stays excluded here.
export const ALL_TEXT_MODELS: Model[] = ALL_MODELS.filter((model) =>
  model.task?.includes("text")
);

export const ALL_TAGS = Array.from(
  new Set(ALL_TEXT_MODELS.flatMap((model) => model.tags))
).sort();

export const ALL_TIERS = Array.from(
  new Set(ALL_TEXT_MODELS.map((model) => model.tier))
).sort();

export const ALL_PROVIDERS = Array.from(
  new Set(ALL_TEXT_MODELS.map((model) => model.provider))
).sort();
