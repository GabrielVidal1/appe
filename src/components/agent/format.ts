/** Money + token formatting for the agent estimator widgets. */

export const money = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (n < 0.01) return "<$0.01";
  if (n < 1) return `$${n.toFixed(2)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  if (n < 10000) return `$${Math.round(n).toLocaleString()}`;
  return `$${(n / 1000).toFixed(1)}k`;
};

export const compactTokens = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  if (n < 1000) return `${Math.round(n)}`;
  if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)}k`;
  if (n < 1e9) return `${(n / 1e6).toFixed(n < 1e7 ? 2 : 1)}M`;
  return `${(n / 1e9).toFixed(2)}B`;
};

export const pct = (x: number): string => `${Math.round(x * 100)}%`;
