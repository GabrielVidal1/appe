/**
 * Where the task text comes from — inline, a file, or stdin.
 *
 * The CLI's whole point is to compose in pipelines: `cat ticket.txt | appe
 * estimate`, or `appe estimate -f prompt.md`. The *decision* of which source to
 * use is pure and unit-tested here; the actual reading (fs / fd 0) lives in
 * `index.ts` behind this, so the priority rules can be pinned without touching
 * the filesystem or a real pipe.
 */

import { readFileSync } from "node:fs";

/** The resolved origin of the task, cheapest-to-most-surprising first. */
export type TaskSource =
  | { kind: "inline"; text: string }
  | { kind: "file"; path: string }
  | { kind: "stdin" }
  | { kind: "none" };

export type TaskSourceInput = {
  /** `--task`/`-t` or the trailing positionals, already joined. */
  inline: string;
  /** `--file`/`-f` value, if given. */
  file?: string;
  /** True when stdin is a pipe/redirect rather than an interactive terminal. */
  stdinPiped: boolean;
};

/**
 * Pick the task source by priority: an inline task always wins (so a flag beats
 * a pipe — you can `--task` past whatever is on stdin), then an explicit
 * `--file`, then piped stdin, then nothing.
 */
export const pickTaskSource = ({ inline, file, stdinPiped }: TaskSourceInput): TaskSource => {
  if (inline.trim()) return { kind: "inline", text: inline.trim() };
  if (file === "-") return { kind: "stdin" }; // the conventional "read stdin" path
  if (file) return { kind: "file", path: file };
  if (stdinPiped) return { kind: "stdin" };
  return { kind: "none" };
};

/** Thrown when a `--file` source can't be read; carries the path for the message. */
export class TaskReadError extends Error {
  constructor(
    readonly path: string,
    readonly cause: Error
  ) {
    super(cause.message);
    this.name = "TaskReadError";
  }
}

/**
 * Turn a resolved source into the task string. `inline` needs no IO; `file`
 * reads the path (raising `TaskReadError` on failure) and `stdin` drains fd 0.
 * `none` returns null — the caller decides how to complain. The result is
 * trimmed, so a trailing newline from `echo …` or an editor doesn't leak into
 * the tokenizer.
 */
export const readTask = (source: TaskSource): string | null => {
  switch (source.kind) {
    case "inline":
      return source.text;
    case "file":
      try {
        return readFileSync(source.path, "utf8").trim();
      } catch (e) {
        throw new TaskReadError(source.path, e as Error);
      }
    case "stdin":
      // fd 0 — a synchronous drain of the pipe, so `main` stays sync.
      return readFileSync(0, "utf8").trim();
    case "none":
      return null;
  }
};
