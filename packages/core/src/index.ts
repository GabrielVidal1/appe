/**
 * @appe/core — the APPE estimator, framework-free.
 *
 * Everything the web app (and, soon, the CLI) needs to turn a described task
 * into a per-model cost: the models.dev catalogue, the token estimators, the
 * image/PDF/audio tokenization rules and the pricing maths. No React, no DOM —
 * it runs in a browser bundle and in plain node alike.
 *
 * The single import surface is this barrel: `import { ... } from "@appe/core"`.
 */

// Types — the shape of an estimate's input, the catalogue and the results.
export type {
  Model,
  ModelSize,
  Provider,
} from "./types/model";
export type {
  AppData,
  AppDataContext,
  DataType,
  ExampleTemplate,
} from "./types/appData";
export { DEFAULT_APP_DATA } from "./types/appData";
export type { ProviderConfig, ProviderParams } from "./types/provider";
export { DEFAULT_PROVIDER, PROVIDERS, getProviderParams } from "./types/provider";
export type { PricingResult, TokenResults } from "./types/results";

// Agentic estimation — types, empirical priors/presets, and the estimator.
export type {
  AgentRunConfig,
  AgentTypology,
  AgentComplexity,
  AgentPricingResult,
  AgentPreset,
  TypologyPrior,
  ComplexityPreset,
  SensitivityDriver,
} from "./types/agent";
export {
  AGENT_DEFAULTS,
  AGENT_POWER_LAW,
  AGENT_PRESETS,
  TYPOLOGY_PRIORS,
  COMPLEXITY_PRESETS,
} from "./types/agent";
export { estimateAgentRun } from "./agentCost";

// The catalogue, generated from models.dev by scripts/sync-models.mjs.
export {
  ALL_MODELS,
  ALL_MODELS_BY_ID,
  ALL_PROVIDERS,
  ALL_TAGS,
  ALL_TEXT_MODELS,
  ALL_TIERS,
  MODELS_META,
} from "./data";

// Estimation + pricing.
export { computePrices, computeTokens, computeTokensAsync } from "./computations";
export { computeImagePrice } from "./imageCost";
export { strToTokens, strToTokensSync } from "./tokenization";

// Shared constants and presentation helpers that are pure functions of the
// estimate (no UI): capability labels, audio defaults, example templates.
export {
  CAPABILITIES_FROM_TAG,
  DEFAULT_AUDIO_TOKENS_PER_SECOND,
  EXAMPLES,
  LOREM_IPSUM,
} from "./constants";
export { tokensToRealWorldText } from "./format";
