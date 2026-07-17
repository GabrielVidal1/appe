import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentPricingResult } from "@appe/core";
import { compactTokens, money, pct } from "./format";

const SEGMENTS: {
  key: keyof AgentPricingResult["tokens"] & keyof AgentPricingResult["cost"];
  label: string;
  color: string;
}[] = [
  { key: "cacheRead", label: "Cache-read", color: "hsl(var(--primary))" },
  { key: "cacheWrite", label: "Cache-write", color: "hsl(217 91% 70%)" },
  { key: "inputFresh", label: "Fresh input", color: "hsl(38 92% 60%)" },
  { key: "output", label: "Output", color: "hsl(142 71% 45%)" },
];

export default function AgentTokenBreakdown({
  result,
}: {
  result: AgentPricingResult;
}) {
  const totalTok = result.tokens.total || 1;
  const totalCost = result.cost.total || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Where the tokens (and the money) go
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* token share bar */}
        <div>
          <div className="mb-1 flex text-xs text-muted-foreground">
            <span>Tokens</span>
            <span className="ml-auto tabular-nums">
              {compactTokens(result.tokens.total)}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full">
            {SEGMENTS.map((s) => {
              const share = result.tokens[s.key] / totalTok;
              if (share <= 0) return null;
              return (
                <div
                  key={s.key}
                  style={{ width: `${share * 100}%`, background: s.color }}
                  title={`${s.label}: ${pct(share)}`}
                />
              );
            })}
          </div>
        </div>

        {/* legend with per-segment tokens + cost */}
        <div className="space-y-2">
          {SEGMENTS.map((s) => {
            const tok = result.tokens[s.key];
            const cost = result.cost[s.key];
            if (tok <= 0 && cost <= 0) return null;
            return (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: s.color }}
                />
                <span className="w-24 shrink-0">{s.label}</span>
                <span className="w-16 shrink-0 tabular-nums text-muted-foreground">
                  {pct(tok / totalTok)}
                </span>
                <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
                  {compactTokens(tok)}
                </span>
                <span className="ml-auto tabular-nums font-medium">
                  {money(cost)}
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-xs text-muted-foreground">
                  {pct(cost / totalCost)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Cache-read is ~96% of tokens in real agent runs — the prefix is
          re-read every turn. Output tokens, the focus of a one-prompt estimate,
          are a rounding error here.
        </p>
      </CardContent>
    </Card>
  );
}
