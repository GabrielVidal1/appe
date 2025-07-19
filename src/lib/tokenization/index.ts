import { Provider } from "@/types/model";

// Fallback function for rough estimation
const strToTokensRough = (str: string): number => {
  // Rough estimation: ~4 chars per token
  return Math.ceil(str.length / 4);
};

// Dynamic imports for tokenizers
let openaiTokenizer: any = null;

const getOpenAITokenizer = async () => {
  if (!openaiTokenizer) {
    const { Tiktoken } = await import("js-tiktoken/lite");
    const res = await fetch(`https://tiktoken.pages.dev/js/o200k_base.json`);
    const o200k_base = await res.json();
    openaiTokenizer = new Tiktoken(o200k_base);
  }
  return openaiTokenizer;
};

export const strToTokens = async (str: string, provider?: Provider): Promise<number> => {
  try {
    switch (provider) {
      case "openai":
        const openaiEnc = await getOpenAITokenizer();
        return openaiEnc.encode(str).length;
        
      case "mistral":
      case "anthropic":
      default:
        // Use rough estimation for mistral, anthropic and fallback
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