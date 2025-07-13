import { ModelSize, Provider } from "@/types/model";

export type DataType = "prompts" | "images" | "pdfs";

export type AppData = {
  // Form fields
  dataCount: number;
  dataType: DataType;
  prompt: string;
  example: string;
  imageSize?: { width: number; height: number };
  pdfData?: { pages: number; tokenPerPage: number };
  modelSize: ModelSize;
  modelCapabilities: string[];

  // results options
  batchEnabled?: boolean | null; // Filter for batch processing
  selectedTiers?: ModelSize[];
  selectedProviders?: Provider[];

  // results table options
  showColumns?: {
    size: boolean;
    inputOutput: boolean;
    tags: boolean;
    cachedTokens?: boolean; // percentage of cached tokens
  };

  // save/share options
  configName?: string; // Optional name for shared configurations
};

export type ExampleTemplate = Partial<AppData> & {
  name: string;
};

export const DEFAULT_FORM_VALUES: AppData = {
  dataCount: 1000,
  dataType: "prompts",
  prompt: "",
  example: "",
  imageSize: { width: 512, height: 512 },
  pdfData: { pages: 10, tokenPerPage: 500 },
  modelSize: "medium",
  modelCapabilities: [],
  configName: "", // Default empty config name
  selectedTiers: ["small", "medium", "big"],
  selectedProviders: ["anthropic", "mistral", "openai"],
  batchEnabled: null, // Default to null, can be set by user
  showColumns: {
    size: false,
    inputOutput: false,
    tags: true,
  },
};
