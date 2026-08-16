import { describe, expect, it } from "vitest";

import { AppData } from "../types/appData";
import { Model } from "../types/model";

import { computePrices, computeTokens, computeTokensAsync } from "../computations";

/** A model with round numbers so the expected costs stay readable. */
const makeModel = (overrides: Partial<Model> = {}): Model => ({
  id: "test/model",
  provider: "openai",
  name: "Test Model",
  version: "1",
  task: ["text"],
  description: "test model",
  model_size: null,
  input_cost: 1, // $1 per Mtok in
  output_cost: 10, // $10 per Mtok out
  cache_cost: null,
  input_audio_cost: null,
  max_token: 100_000,
  tier: "medium",
  tags: [],
  license: "commercial",
  speed_tps: 70,
  ttft_s: 0.5,
  speed_source: "estimated",
  ...overrides,
});

const makeAppData = (overrides: Partial<AppData> = {}): AppData => ({
  dataCount: 1,
  dataType: "prompts",
  prompt: "a".repeat(400), // 100 rough tokens
  example: "b".repeat(40), // 10 rough tokens
  modelSize: "medium",
  modelCapabilities: [],
  selectedModels: [],
  ...overrides,
});

describe("computeTokens — prompts", () => {
  it("counts prompt and example text only", () => {
    const result = computeTokens(makeAppData(), makeModel());

    expect(result.inputTokens).toEqual({
      text: 100,
      document: 0,
      image: 0,
      audio: 0,
      total: 100,
    });
    expect(result.outputTokens).toBe(10);
    expect(result.reasoningOverheadTokens).toBe(0);
    expect(result.totalTokens).toBe(110);
  });

  it("does not scale tokens by dataCount (that happens when pricing)", () => {
    const result = computeTokens(makeAppData({ dataCount: 5000 }), makeModel());

    expect(result.totalTokens).toBe(110);
  });
});

describe("computeTokens — reasoning models", () => {
  it("inflates output tokens by reasoningOutputMultiplier for a reasoning-tagged model", () => {
    const result = computeTokens(
      makeAppData(),
      makeModel({ tags: ["reasoning"] })
    );

    // 10 raw output tokens × 8 (AGENT_DEFAULTS.reasoningOutputMultiplier)
    expect(result.outputTokens).toBe(80);
    expect(result.reasoningOverheadTokens).toBe(70);
    expect(result.totalTokens).toBe(180);
  });

  it("leaves non-reasoning-tagged models untouched", () => {
    const result = computeTokens(
      makeAppData(),
      makeModel({ tags: ["vision", "multilingual"] })
    );

    expect(result.outputTokens).toBe(10);
    expect(result.reasoningOverheadTokens).toBe(0);
  });

  it("is a no-op with no model (tags unknown)", () => {
    const result = computeTokens(makeAppData());

    expect(result.outputTokens).toBe(10);
    expect(result.reasoningOverheadTokens).toBe(0);
  });
});

describe("computeTokens — images", () => {
  it("adds the provider's image tokens, rounded to a whole token", () => {
    const result = computeTokens(
      makeAppData({ dataType: "images", imageSize: { width: 1024, height: 1024 } }),
      makeModel({ provider: "openai" })
    );

    expect(result.inputTokens.image).toBe(765); // 85 + 170 * 4 tiles
    expect(result.inputTokens.total).toBe(100 + 765);
  });

  it("uses the anthropic image basis for an anthropic model", () => {
    const result = computeTokens(
      makeAppData({ dataType: "images", imageSize: { width: 1000, height: 1000 } }),
      makeModel({ provider: "anthropic" })
    );

    expect(result.inputTokens.image).toBe(1333); // (1000*1000)/750, rounded
  });

  it("falls back to openai tiling when no model is selected", () => {
    const result = computeTokens(
      makeAppData({ dataType: "images", imageSize: { width: 1024, height: 1024 } })
    );

    expect(result.inputTokens.image).toBe(765);
  });
});

describe("computeTokens — pdfs", () => {
  it("prefers the provider's known tokens-per-page over the form value", () => {
    // provider_data.json: anthropic => pdf.tokenPerPage = 2333
    const result = computeTokens(
      makeAppData({ dataType: "pdfs", pdfData: { pages: 10, tokenPerPage: 500 } }),
      makeModel({ provider: "anthropic" })
    );

    expect(result.inputTokens.document).toBe(10 * 2333);
  });

  it("uses the form's tokens-per-page when the provider has none", () => {
    const result = computeTokens(
      makeAppData({ dataType: "pdfs", pdfData: { pages: 10, tokenPerPage: 500 } }),
      makeModel({ provider: "openai" })
    );

    expect(result.inputTokens.document).toBe(5000);
  });
});

describe("computeTokens — audio", () => {
  it("counts duration x tokens-per-second", () => {
    const result = computeTokens(
      makeAppData({ dataType: "audio", audioData: { seconds: 60, tokensPerSecond: 32 } }),
      makeModel()
    );

    expect(result.inputTokens.audio).toBe(1920);
    expect(result.inputTokens.total).toBe(100 + 1920);
  });
});

describe("computeTokensAsync", () => {
  it("matches the sync estimate for a rough-tokenized provider", async () => {
    const appData = makeAppData({ dataType: "audio", audioData: { seconds: 10, tokensPerSecond: 32 } });
    const model = makeModel({ provider: "anthropic" });

    await expect(computeTokensAsync(appData, model)).resolves.toEqual(
      computeTokens(appData, model)
    );
  });
});

describe("computePrices — prompts", () => {
  it("prices input and output per million tokens, scaled by dataCount", () => {
    const appData = makeAppData({ dataCount: 1000 });
    const model = makeModel();
    const tokens = computeTokens(appData, model);

    const prices = computePrices(appData, model, tokens);

    expect(prices.inputCost.text).toBeCloseTo((100 * 1) / 1e6 * 1000, 12); // $0.1
    expect(prices.outputCost).toBeCloseTo((10 * 10) / 1e6 * 1000, 12); // $0.1
    expect(prices.totalCost).toBeCloseTo(0.2, 12);
  });

  it("leaves the non-text cost buckets empty", () => {
    const appData = makeAppData();
    const model = makeModel();

    const prices = computePrices(appData, model, computeTokens(appData, model));

    expect(prices.inputCost.document).toBe(0);
    expect(prices.inputCost.image).toBe(0);
    expect(prices.inputCost.audio).toBe(0);
  });

  it("bills a reasoning-tagged model's hidden thinking tokens as output cost", () => {
    const appData = makeAppData({ dataCount: 1000 });
    const plainModel = makeModel();
    const reasoningModel = makeModel({ tags: ["reasoning"] });

    const plainCost = computePrices(
      appData,
      plainModel,
      computeTokens(appData, plainModel)
    ).outputCost;
    const reasoningCost = computePrices(
      appData,
      reasoningModel,
      computeTokens(appData, reasoningModel)
    ).outputCost;

    // Same $/Mtok output rate, but 8x the tokens for the reasoning model —
    // undercosting this before the fix.
    expect(reasoningCost).toBeCloseTo(plainCost * 8, 6);
  });
});

describe("computePrices — batch discount", () => {
  it("applies the provider's batch discount when batching is enabled", () => {
    const model = makeModel({ provider: "anthropic" }); // batchDiscount 0.5
    const batched = makeAppData({ dataCount: 1000, batchEnabled: true });
    const plain = makeAppData({ dataCount: 1000 });

    const batchedCost = computePrices(batched, model, computeTokens(batched, model)).totalCost;
    const plainCost = computePrices(plain, model, computeTokens(plain, model)).totalCost;

    expect(batchedCost).toBeCloseTo(plainCost * 0.5, 12);
  });

  it("does not discount a provider with no known batch pricing", () => {
    const model = makeModel({ provider: "some-new-provider" });
    const batched = makeAppData({ dataCount: 1000, batchEnabled: true });
    const plain = makeAppData({ dataCount: 1000 });

    const batchedCost = computePrices(batched, model, computeTokens(batched, model)).totalCost;
    const plainCost = computePrices(plain, model, computeTokens(plain, model)).totalCost;

    expect(batchedCost).toBeCloseTo(plainCost, 12);
  });
});

describe("computePrices — pdfs", () => {
  it("bills per page when the provider prices PDFs per 1000 pages", () => {
    // provider_data.json: mistral => pdf.pricePerKPage = 1  ($1 per 1000 pages)
    const appData = makeAppData({
      dataType: "pdfs",
      dataCount: 100,
      pdfData: { pages: 10, tokenPerPage: 500 },
    });
    const model = makeModel({ provider: "mistral" });

    const prices = computePrices(appData, model, computeTokens(appData, model));

    expect(prices.inputCost.document).toBeCloseTo(10 * (1 / 1000) * 100, 12); // $1
  });

  it("bills PDF pages as input tokens when the provider has no page pricing", () => {
    const appData = makeAppData({
      dataType: "pdfs",
      dataCount: 100,
      pdfData: { pages: 10, tokenPerPage: 500 },
    });
    const model = makeModel({ provider: "openai" }); // no pdf params
    const tokens = computeTokens(appData, model);

    const prices = computePrices(appData, model, tokens);

    expect(tokens.inputTokens.document).toBe(5000);
    expect(prices.inputCost.document).toBeCloseTo((5000 * 1) / 1e6 * 100, 12); // $0.5
  });
});

describe("computePrices — images", () => {
  it("uses the provider's own image price when it has one", () => {
    const appData = makeAppData({
      dataType: "images",
      dataCount: 1000,
      imageSize: { width: 1024, height: 1024 },
    });
    // input_cost is irrelevant here: openai images are priced directly.
    const model = makeModel({ provider: "openai", input_cost: 999 });

    const prices = computePrices(appData, model, computeTokens(appData, model));

    expect(prices.inputCost.image).toBeCloseTo(0.00765 * 1000, 9);
  });

  it("prices images with the model's input rate for an unknown provider", () => {
    const appData = makeAppData({
      dataType: "images",
      dataCount: 1000,
      imageSize: { width: 750, height: 1000 },
    });
    const model = makeModel({ provider: "some-new-provider", input_cost: 2 });

    const prices = computePrices(appData, model, computeTokens(appData, model));

    // (750*1000)/750 = 1000 tokens, at $2/Mtok, 1000 items
    expect(prices.inputCost.image).toBeCloseTo((1000 * 2) / 1e6 * 1000, 12); // $2
  });
});

describe("computePrices — audio", () => {
  it("uses the dedicated audio rate when the model has one", () => {
    const appData = makeAppData({
      dataType: "audio",
      dataCount: 100,
      audioData: { seconds: 60, tokensPerSecond: 32 },
    });
    const model = makeModel({ input_cost: 1, input_audio_cost: 40 });

    const prices = computePrices(appData, model, computeTokens(appData, model));

    expect(prices.inputCost.audio).toBeCloseTo((1920 * 40) / 1e6 * 100, 12);
  });

  it("falls back to the text input rate when the model prices audio as input", () => {
    const appData = makeAppData({
      dataType: "audio",
      dataCount: 100,
      audioData: { seconds: 60, tokensPerSecond: 32 },
    });
    const model = makeModel({ input_cost: 1, input_audio_cost: null });

    const prices = computePrices(appData, model, computeTokens(appData, model));

    expect(prices.inputCost.audio).toBeCloseTo((1920 * 1) / 1e6 * 100, 12);
  });
});

describe("computePrices — cached input tokens", () => {
  // Cache-aware pricing: only the first of `dataCount` calls pays the full
  // input rate; every subsequent call reads the same prompt from cache at the
  // (cheaper) cache rate — and totalCost must include that cached cost, since
  // it's just as real a charge as any other cost bucket.
  const appData = makeAppData({ dataCount: 1000 });

  it("bills one call at the full rate and the rest at the cache rate, reflected in totalCost", () => {
    const model = makeModel({ cache_cost: 0.1 });
    const prices = computePrices(appData, model, computeTokens(appData, model));

    const expectedFull = (100 * 1) / 1e6; // one call, full input rate
    const expectedCached = (1000 - 1) * 100 * (0.1 / 1e6); // 999 calls, cache rate

    expect(prices.inputCost.text).toBeCloseTo(expectedFull, 12);
    expect(prices.inputCost.total).toBeCloseTo(expectedFull + expectedCached, 12);
    expect(prices.totalCost).toBeCloseTo(prices.inputCost.total + prices.outputCost, 12);
  });

  it("charges nothing extra when the model has no cache pricing", () => {
    const model = makeModel({ cache_cost: null });
    const prices = computePrices(appData, model, computeTokens(appData, model));

    expect(prices.inputCost.text).toBeCloseTo((100 * 1) / 1e6 * 1000, 12);
    expect(prices.inputCost.total).toBeCloseTo(prices.inputCost.text, 12);
    expect(prices.totalCost).toBeCloseTo(prices.inputCost.total + prices.outputCost, 12);
  });
});
