export type ModelSize = "small" | "medium" | "big";

export type DataType = "prompts" | "images" | "pdfs";

export interface FormDataContext {
  dataCount: number;
  dataType: DataType;
  prompt: string;
  example: string;
  imageSize?: { width: number; height: number };
  pdfData?: { pages: number; tokenPerPage: number };
  modelSize: ModelSize;
  modelCapabilities: string[];

  showColumns?: {
    size: boolean;
    inputOutput: boolean;
    tags: boolean;
  };

  selectedTiers?: ("small" | "medium" | "big")[];
  selectedProviders?: ("claude" | "mistral" | "openai")[];
}
