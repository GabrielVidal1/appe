import { describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM script module, no types
import { deriveModelSize } from "../model-size.mjs";

const size = (id: string, name = id) => deriveModelSize(id, name) as number | null;

describe("deriveModelSize", () => {
  it("reads the parameter count out of an open-weight id", () => {
    expect(size("gpt-oss-120b")).toBe(120);
    expect(size("llama-3.2-1b-instruct")).toBe(1);
    expect(size("google/gemma-4-31b-it")).toBe(31);
    expect(size("sao10k/l3-lunaris-8b")).toBe(8);
  });

  it("keeps the total, not the active, parameters of an MoE pair", () => {
    expect(size("qwen/qwen3-235b-a22b")).toBe(235);
    expect(size("qwen/qwen3-next-80b-a3b-instruct")).toBe(80);
  });

  it("multiplies out an experts × size MoE name", () => {
    expect(size("mistralai/mixtral-8x22b-instruct")).toBe(176);
  });

  it("reads the size off the display name when the id omits it", () => {
    expect(size("qwen/qwen3-coder:free", "Qwen3 Coder 480B A35B (free)")).toBe(480);
  });

  it("returns null for models that publish no size", () => {
    expect(size("claude-opus-4-8")).toBeNull();
    expect(size("gemini-2.5-flash")).toBeNull();
    expect(size("mistral-nemo")).toBeNull();
    expect(size("ibm-granite/granite-4.0-h-micro")).toBeNull();
  });

  it("is not fooled by version/date tokens ending in b", () => {
    expect(size("x-ai/grok-3-beta")).toBeNull();
    expect(size("openai/o3-mini-2025-01-31")).toBeNull();
  });
});
