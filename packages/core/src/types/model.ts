// Provider ids come from models.dev (e.g. "anthropic", "openai", "openrouter",
// "groq", …). It is an open string rather than a fixed union so the daily sync
// can introduce new providers without a code change.
export type Provider = string;

export type ModelSize = "small" | "medium" | "big";

export type Model = {
  /**
   * unique identifier for the model. should be the model name for api calls.
   */
  id: string;

  /**
   * The provider of the model.
   * This can be "anthropic", "mistral", "openai", or any other provider.
   */
  provider: Provider;

  /**
   * model usage name.
   */
  name: string;

  /**
   * Version of the model.
   */
  version: string;

  /**
   * the task that the model is designed for.
   * This can be text, code, image, or a more specific task like summarization, translation, etc.
   */
  task?: ("text" | "code" | "image" | string)[];

  /**
   * A short description of the model.
   */
  description: string;

  /**
   * Size of the model in billions of parameters.
   */
  model_size: number | null;

  /**
   * Cost per million tokens for input.
   */
  input_cost: number;

  /**
   * Cost per million tokens for output.
   */
  output_cost: number;

  /**
   * Cost per million tokens for cached input tokens
   */
  cache_cost: number | null;

  /**
   * Cost per million audio-input tokens, when the provider prices audio
   * separately. Null means audio is billed at the regular input_cost rate.
   */
  input_audio_cost: number | null;

  /**
   * Maximum number of input tokens. Length of the context window.
   */
  max_token: number | null;

  /**
   * Size of the model.
   */
  tier: ModelSize;

  /**
   * List of capabilities that the model supports.
   * vision, code, multilingual, reasoning, etc.
   */
  tags: string[];

  /**
   * License type of the model.
   * opensource, commercial, proprietary, or the name of the license.
   */
  license: "opensource" | "commercial" | "proprietary" | string; // the name of the license

  /**
   * Median output generation speed, in output tokens per second, as measured by
   * Artificial Analysis (P50 over the trailing window). This is what makes
   * smaller models "faster": a task's wall-clock is dominated by output tokens ÷
   * this rate. Null when we have no measurement AND no fallback (never happens
   * in practice — the sync always fills a tier-based estimate). See `speed.ts`.
   */
  speed_tps: number | null;

  /**
   * Median time-to-first-token, in seconds (the latency before generation
   * starts). Added to `outputTokens / speed_tps` gives the total response time.
   */
  ttft_s: number | null;

  /**
   * Where the speed figures came from:
   * - "measured"  — from the Artificial Analysis benchmark (real numbers).
   * - "estimated" — a tier-based fallback (small≈fast … big≈slow) used when the
   *                 model isn't in the benchmark or no AA_API_KEY was set.
   * The UI badges "estimated" so the reader knows it's a heuristic.
   */
  speed_source: "measured" | "estimated";
};
