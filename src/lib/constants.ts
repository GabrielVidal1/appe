import { ALL_MODELS } from "./computations";

export const ALL_TAGS = Array.from(
  new Set(ALL_MODELS.flatMap((model) => model.tags))
).sort();

export const ALL_TIERS = Array.from(
  new Set(ALL_MODELS.map((model) => model.tier))
).sort();

export const ALL_PROVIDERS = Array.from(
  new Set(ALL_MODELS.map((model) => model.provider))
).sort();
