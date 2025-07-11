type Model = {
  provider: string;
  model: string;
  version: string;
  description: string;
  model_size: number | null;
  input_cost: number;
  output_cost: number;
  cache_cost: number | null;
  max_token: number | null;
};
