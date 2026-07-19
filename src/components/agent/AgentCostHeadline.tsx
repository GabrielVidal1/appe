import { Card, CardContent } from "@/components/ui/card";
import { AgentPricingResult, formatDuration } from "@appe/core";
import { ProviderIcon } from "@/components/ProviderIcons";
import { Clock } from "lucide-react";
import { money } from "./format";

const DRIVER_COPY: Record<AgentPricingResult["dominatedBy"], string> = {
  turns: "turn count",
  context: "context growth",
  output: "output length",
};

export default function AgentCostHeadline({
  result,
}: {
  result: AgentPricingResult;
}) {
  const { model, band, dominatedBy, runs, turns, durationSeconds } = result;
  const estimated = model.speed_source === "estimated";

  return (
    <Card className="overflow-hidden border-primary/40">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ProviderIcon provider={model.provider} className="h-4 w-4" />
          <span className="font-medium text-foreground">{model.name}</span>
          <span>· {model.provider}</span>
        </div>

        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold tabular-nums">
            {money(band.p50)}
          </span>
          <span className="pb-1 text-sm text-muted-foreground">
            {runs > 1 ? `for ${runs.toLocaleString()} runs` : "per run"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">80% range</span>
            <span className="font-medium tabular-nums">
              {money(band.p10)} – {money(band.p90)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">~</span>
            <span
              className="font-medium tabular-nums"
              title={
                estimated
                  ? "Estimated from the model's price tier — no measured benchmark for this model."
                  : "From Artificial Analysis benchmark (median output tokens/sec + time-to-first-token)."
              }
            >
              {formatDuration(durationSeconds)}
            </span>
            <span className="text-muted-foreground">
              model time{estimated && " (est.)"}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Wall-clock is the model's generation time only ({model.speed_tps ?? "—"}{" "}
          tok/s{estimated ? ", tier-estimated" : ", measured"}) — it excludes
          tool execution, network, and thinking between turns.
        </p>

        <p className="text-sm text-muted-foreground">
          Dominated by{" "}
          <span className="font-medium text-foreground">
            {DRIVER_COPY[dominatedBy]}
          </span>
          . {dominatedBy === "turns" && turns > 2 && (
            <>
              Halving to {Math.round(turns / 2)} turns → ~
              {money(band.p50 / Math.pow(2, 1.2))}.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
