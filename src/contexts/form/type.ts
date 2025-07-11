export interface FormDataContext {
  dataCount: number;
  dataType: string;
  prompt: string;
  example: string;
  imageSize?: { width: number; height: number };
  modelSize: "small" | "medium" | "big";
  modelCapabilities: string[];

  showColumns?: {
    size: boolean;
    inputOutput: boolean;
    tags: boolean;
  };

  selectedTiers?: ("small" | "medium" | "big")[];
  selectedProviders?: ("claude" | "mistral" | "openai")[];
}
