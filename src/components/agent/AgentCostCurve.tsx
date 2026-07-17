import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AGENT_DEFAULTS,
  AgentRunConfig,
  Model,
  estimateAgentRun,
} from "@appe/core";
import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "./format";

/**
 * Cost as a function of turn count, for the chosen model — this is where the
 * super-linear shape becomes visible. The shaded band is the empirical 80%
 * uncertainty (median × exp(±1.28σ)).
 */
export default function AgentCostCurve({
  config,
  model,
}: {
  config: AgentRunConfig;
  model: Model;
}) {
  const data = useMemo(() => {
    const maxN = Math.max(50, Math.ceil((config.turns || 1) * 2));
    const step = Math.max(1, Math.round(maxN / 60));
    const s = AGENT_DEFAULTS.residualLnSigma;
    const pts: {
      turns: number;
      cost: number;
      lo: number;
      // recharts stacks the band as [lo, hi-lo]
      bandBase: number;
      bandSpan: number;
    }[] = [];
    for (let n = step; n <= maxN; n += step) {
      const cost = estimateAgentRun({ ...config, turns: n }, model).cost.total;
      const lo = cost * Math.exp(-1.28 * s);
      const hi = cost * Math.exp(1.28 * s);
      pts.push({ turns: n, cost, lo, bandBase: lo, bandSpan: hi - lo });
    }
    return pts;
  }, [config, model]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Cost vs. turns — {model.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
            >
              <XAxis
                dataKey="turns"
                tick={{ fontSize: 11 }}
                tickLine={false}
                label={{
                  value: "AI messages (turns)",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 11,
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                width={48}
                tickFormatter={(v) => money(v)}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "cost") return [money(value), "median"];
                  return null;
                }}
                labelFormatter={(l) => `${l} turns`}
                contentStyle={{ fontSize: 12 }}
              />
              {/* uncertainty band: transparent base + visible span on top */}
              <Area
                type="monotone"
                dataKey="bandBase"
                stackId="band"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="bandSpan"
                stackId="band"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.12}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine
                x={config.turns}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{
                  value: "you",
                  position: "top",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Shaded band = empirical 80% range. The curve bends upward: cost grows
          faster than turns.
        </p>
      </CardContent>
    </Card>
  );
}
