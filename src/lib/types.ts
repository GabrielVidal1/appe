export type Provider = "claude" | "mistral" | "openai";

export type Model = {
  provider: Provider;
  model: string;
  version: string;
  description: string;
  model_size: number | null;
  input_cost: number;
  output_cost: number;
  cache_cost: number | null;
  max_token: number | null;
  tier: "small" | "medium" | "big";
  tag: string[];
};

export interface FormData {
  dataCount: number;
  dataType: string;
  prompt: string;
  example: string;
  imageSize?: { width: number; height: number };
  modelSize: "small" | "medium" | "big";
  modelCapabilities: string[];
}
