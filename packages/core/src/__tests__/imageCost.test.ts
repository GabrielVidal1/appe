import { describe, expect, it } from "vitest";

import { computeImagePrice } from "../imageCost";

describe("computeImagePrice — anthropic", () => {
  it("tokenizes at ~750 px per token and prices at $3/Mtok", () => {
    const { tokens, cost } = computeImagePrice("anthropic", 1000, 1000);

    expect(tokens).toBeCloseTo(1_000_000 / 750, 6);
    expect(cost).toBeCloseTo((1_000_000 / 750 / 1_000_000) * 3, 9);
  });
});

describe("computeImagePrice — mistral", () => {
  it("tokenizes at 784 px per token and carries no direct cost", () => {
    const { tokens, cost } = computeImagePrice("mistral", 784, 784);

    expect(tokens).toBeCloseTo(784, 6);
    expect(cost).toBeUndefined();
  });
});

describe("computeImagePrice — openai (512px tiling)", () => {
  it("charges the base token plus one tile for a 512x512 image", () => {
    // 85 base + 170 per 512x512 tile
    expect(computeImagePrice("openai", 512, 512).tokens).toBe(85 + 170);
  });

  it("charges four tiles for a 1024x1024 image", () => {
    const { tokens, cost } = computeImagePrice("openai", 1024, 1024);

    expect(tokens).toBe(85 + 170 * 4); // 765
    expect(cost).toBeCloseTo(0.00765, 9); // the documented $0.00765 for 765 tokens
  });

  it("rounds a partial tile up", () => {
    // 600x600 -> ceil(600/512) = 2 tiles on each axis
    expect(computeImagePrice("openai", 600, 600).tokens).toBe(85 + 170 * 4);
  });

  it("downscales a landscape image to fit 1024px on the long edge", () => {
    // 2048x1024 -> 1024x512 -> 2 tiles wide, 1 tall
    expect(computeImagePrice("openai", 2048, 1024).tokens).toBe(85 + 170 * 2);
  });

  it("downscales a portrait image to fit 1024px on the long edge", () => {
    // 1024x2048 -> 512x1024 -> 1 tile wide, 2 tall
    expect(computeImagePrice("openai", 1024, 2048).tokens).toBe(85 + 170 * 2);
  });

  it("leaves an image already under 1024px alone", () => {
    // 1000x100 -> ceil(1000/512) = 2 tiles wide, 1 tall
    expect(computeImagePrice("openai", 1000, 100).tokens).toBe(85 + 170 * 2);
  });
});

describe("computeImagePrice — unknown provider", () => {
  it("defaults to the ~750 px/token basis and returns no direct cost", () => {
    // No direct cost means the caller prices the image with the model's
    // per-token input rate — the "use a default when not known" path.
    const { tokens, cost } = computeImagePrice("groq", 1500, 1000);

    expect(tokens).toBeCloseTo((1500 * 1000) / 750, 6);
    expect(cost).toBeUndefined();
  });
});
