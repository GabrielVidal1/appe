import { Provider } from "@/types/model";

function resizeOpenAI(width: number, height: number): [number, number] {
  if (width > 1024 || height > 1024) {
    if (width > height) {
      height = Math.floor((height * 1024) / width);
      width = 1024;
    } else {
      width = Math.floor((width * 1024) / height);
      height = 1024;
    }
  }
  return [width, height];
}

export function computeImagePrice(
  provider: Provider,
  width: number,
  height: number
): { tokens: number; cost?: number } {
  if (provider === "anthropic") {
    const tokens = (width * height) / 750;
    const cost = (tokens / 1_000_000) * 3.0;
    return { tokens, cost };
  }

  if (provider === "mistral") {
    const tokens = (width * height) / 784;
    return { tokens }; // No pricing info available
  }

  if (provider === "openai") {
    const [w, h] = resizeOpenAI(width, height);
    const hw = Math.ceil(h / 512);
    const ww = Math.ceil(w / 512);
    const tokens = 85 + 170 * hw * ww;
    const costPerToken = 0.00765 / 765;
    const cost = tokens * costPerToken;
    return { tokens, cost };
  }

  throw new Error("Unsupported provider: " + provider);
}
