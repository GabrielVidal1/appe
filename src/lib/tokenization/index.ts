import { Provider } from "@/types/model";

// Fallback function for rough estimation
const strToTokensRough = (str: string): number => {
  // Rough estimation: ~4 chars per token
  return Math.ceil(str.length / 4);
};

// Dynamic imports for tokenizers
let openaiTokenizer: any = null;
let mistralTokenizer: any = null;

const getOpenAITokenizer = async () => {
  if (!openaiTokenizer) {
    const { get_encoding } = await import("tiktoken");
    openaiTokenizer = get_encoding("cl100k_base");
  }
  return openaiTokenizer;
};

const getMistralTokenizer = async () => {
  if (!mistralTokenizer) {
    const { MistralTokenizer } = await import("mistral-tokenizer-ts");
    mistralTokenizer = new MistralTokenizer();
  }
  return mistralTokenizer;
};

export const strToTokens = async (str: string, provider?: Provider): Promise<number> => {
  try {
    switch (provider) {
      case "openai":
        const openaiEnc = await getOpenAITokenizer();
        return openaiEnc.encode(str).length;
        
      case "mistral":
        const mistralEnc = await getMistralTokenizer();
        return mistralEnc.encode(str).length;
        
      case "anthropic":
      default:
        // Use rough estimation for anthropic and fallback
        return strToTokensRough(str);
    }
  } catch (error) {
    console.warn(`Failed to tokenize with ${provider} tokenizer, falling back to rough estimation:`, error);
    return strToTokensRough(str);
  }
};

// Synchronous version for backward compatibility
export const strToTokensSync = (str: string): number => {
  return strToTokensRough(str);
};