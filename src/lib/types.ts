export type Provider = "claude" | "mistral" | "openai";

export type Model = {
  provider: Provider;
  model: string;
  version: string;
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
  tier: "small" | "medium" | "big";

  /**
   * List of capabilities that the model supports.
   * vision, code, multilingual, reasoning, etc.
   */
  tags: string[];
};
