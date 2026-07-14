import { afterEach, describe, expect, it, vi } from "vitest";

import { strToTokens, strToTokensSync } from "../tokenization";

describe("strToTokensSync (rough estimation, ~4 chars per token)", () => {
  it("is zero for an empty string", () => {
    expect(strToTokensSync("")).toBe(0);
  });

  it("counts one token per 4 characters", () => {
    expect(strToTokensSync("abcd")).toBe(1);
    expect(strToTokensSync("abcdefgh")).toBe(2);
  });

  it("rounds a partial token up", () => {
    expect(strToTokensSync("a")).toBe(1);
    expect(strToTokensSync("abcde")).toBe(2);
  });
});

describe("strToTokens (async)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["anthropic", "mistral", undefined, "some-new-provider"])(
    "falls back to the rough estimate for %s",
    async (provider) => {
      const text = "a".repeat(40);
      await expect(strToTokens(text, provider)).resolves.toBe(10);
    }
  );

  it("falls back to the rough estimate when the openai tokenizer cannot be fetched", async () => {
    // The o200k_base ranks are fetched from the network on first use; when that
    // fails (offline, blocked) the estimator must degrade, not throw.
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(strToTokens("a".repeat(20), "openai")).resolves.toBe(5);
  });
});
