/**
 * Terminal presentation helpers — money, numbers, colour and table layout.
 *
 * Nothing here computes anything: every number the CLI prints comes out of
 * `@appe/core`. This file only decides how it looks.
 */

const useColour =
  process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb";

const wrap = (code: string) => (s: string) =>
  useColour ? `\u001b[${code}m${s}\u001b[0m` : s;

export const bold = wrap("1");
export const dim = wrap("2");
export const green = wrap("32");
export const yellow = wrap("33");
export const cyan = wrap("36");
export const red = wrap("31");

/**
 * Format a dollar amount with enough precision to stay meaningful across the
 * six orders of magnitude the catalogue spans (a $0.000002 prompt on a nano
 * model, a $4,000 batch on a frontier one).
 */
export const usd = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (n >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.000001) return `$${n.toFixed(6)}`;
  return "<$0.000001";
};

/** Per-million-token rate, as models.dev states it. */
export const rate = (n: number): string => {
  if (n === 0) return "0";
  if (n >= 100) return n.toFixed(0);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(3);
};

export const int = (n: number): string => Math.round(n).toLocaleString("en-US");

/** Truncate to a hard width, with an ellipsis when it bites. */
export const truncate = (s: string, width: number): string =>
  s.length <= width ? s : `${s.slice(0, Math.max(0, width - 1))}…`;

/** Visible length, ignoring ANSI escapes (so padding stays honest in colour). */
const visibleLength = (s: string): number =>
  // eslint-disable-next-line no-control-regex
  s.replace(/\u001b\[[0-9;]*m/g, "").length;

const pad = (s: string, width: number, align: "left" | "right"): string => {
  const gap = Math.max(0, width - visibleLength(s));
  return align === "right" ? " ".repeat(gap) + s : s + " ".repeat(gap);
};

export type Column<T> = {
  header: string;
  align?: "left" | "right";
  /** Hard cap on content width; longer cells are truncated. */
  max?: number;
  value: (row: T, index: number) => string;
};

/**
 * Render a plain, aligned table. No box-drawing — this is meant to survive
 * being piped into `less`, `grep` or a PR description.
 */
export const table = <T>(rows: T[], columns: Column<T>[]): string => {
  const cells = rows.map((row, i) =>
    columns.map((c) => {
      const v = c.value(row, i);
      return c.max ? truncate(v, c.max) : v;
    })
  );

  const widths = columns.map((c, ci) =>
    Math.max(
      visibleLength(c.header),
      ...cells.map((r) => visibleLength(r[ci])),
      0
    )
  );

  const header = columns
    .map((c, ci) => pad(dim(c.header), widths[ci], c.align ?? "left"))
    .join("  ");

  const body = cells.map((r) =>
    r.map((cell, ci) => pad(cell, widths[ci], columns[ci].align ?? "left")).join("  ")
  );

  return [header, ...body].join("\n");
};
