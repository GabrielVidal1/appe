import { Model, Provider } from "@/types/model";
import { chain } from "lodash";
import anthropicModels from "./anthropic_models.json";
import mistralModels from "./mistral_models.json";
import openaiModels from "./openai_models.json";

const models: Record<Provider, Model[]> = {
  mistral: mistralModels as Model[],
  anthropic: anthropicModels as Model[],
  openai: openaiModels as Model[],
};

export const ALL_MODELS = models;

// Type assertion to ensure data matches our Model type
export const ALL_TEXT_MODELS: Model[] = chain(models)
  .values()
  .flatten()
  .filter((model) => model.task?.includes("text"))
  .value();

export const ALL_TAGS = Array.from(
  new Set(ALL_TEXT_MODELS.flatMap((model) => model.tags))
).sort();

export const ALL_TIERS = Array.from(
  new Set(ALL_TEXT_MODELS.map((model) => model.tier))
).sort();

export const ALL_PROVIDERS = Array.from(
  new Set(ALL_TEXT_MODELS.map((model) => model.provider))
).sort();
