import { Card, CardContent } from "@/components/ui/card";
import { AgentPricingResult } from "@appe/core";
import { ProviderIcon } from "@/components/ProviderIcons";
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
  const { model, band, dominatedBy, runs, turns } = result;

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

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">80% range</span>
          <span className="font-medium tabular-nums">
            {money(band.p10)} – {money(band.p90)}
          </span>
        </div>

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
