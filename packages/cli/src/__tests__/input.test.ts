import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { pickTaskSource, readTask, TaskReadError, type TaskSourceInput } from "../input";

const input = (over: Partial<TaskSourceInput> = {}): TaskSourceInput => ({
  inline: "",
  file: undefined,
  stdinPiped: false,
  ...over,
});

describe("pickTaskSource", () => {
  it("prefers an inline task over everything else (a flag beats the pipe)", () => {
    expect(
      pickTaskSource(input({ inline: "  summarise a ticket  ", file: "a.txt", stdinPiped: true }))
    ).toEqual({ kind: "inline", text: "summarise a ticket" });
  });

  it("falls back to a file when there is no inline task", () => {
    expect(pickTaskSource(input({ file: "prompt.md", stdinPiped: true }))).toEqual({
      kind: "file",
      path: "prompt.md",
    });
  });

  it("treats `--file -` as an explicit request to read stdin", () => {
    expect(pickTaskSource(input({ file: "-" }))).toEqual({ kind: "stdin" });
  });

  it("reads a piped stdin when nothing else is given", () => {
    expect(pickTaskSource(input({ stdinPiped: true }))).toEqual({ kind: "stdin" });
  });

  it("is `none` on an interactive terminal with no task", () => {
    expect(pickTaskSource(input())).toEqual({ kind: "none" });
  });

  it("does not mistake a whitespace-only inline task for a real one", () => {
    expect(pickTaskSource(input({ inline: "   \n\t ", stdinPiped: true }))).toEqual({
      kind: "stdin",
    });
  });
});

describe("readTask", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "appe-input-"));
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns inline text untouched", () => {
    expect(readTask({ kind: "inline", text: "classify a review" })).toBe("classify a review");
  });

  it("returns null for `none` so the caller can complain in context", () => {
    expect(readTask({ kind: "none" })).toBeNull();
  });

  it("reads a file and trims a trailing newline", () => {
    const p = path.join(dir, "prompt.txt");
    writeFileSync(p, "answer a question about a PDF\n");
    expect(readTask({ kind: "file", path: p })).toBe("answer a question about a PDF");
  });

  it("raises TaskReadError, carrying the path, when the file is missing", () => {
    const p = path.join(dir, "does-not-exist.txt");
    try {
      readTask({ kind: "file", path: p });
      expect.unreachable("readTask should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(TaskReadError);
      expect((e as TaskReadError).path).toBe(p);
    }
  });
});
