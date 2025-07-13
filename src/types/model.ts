export type Provider = "anthropic" | "mistral" | "openai";

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
};
