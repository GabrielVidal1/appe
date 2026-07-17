import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentTypology, TYPOLOGY_PRIORS } from "@appe/core";

const ORDER: AgentTypology[] = [
  "refactor",
  "research",
  "feature",
  "bugfix",
  "chore",
  "deploy",
];

/** A reality-check reference: the empirical per-typology medians, so the user
 *  can sanity-check the mechanism against what real runs actually cost. */
export default function AgentTypologyReference() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Reference — real Claude Code runs by task type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task type</TableHead>
              <TableHead className="text-right">Median msgs</TableHead>
              <TableHead className="text-right">Median cost</TableHead>
              <TableHead className="text-right">80% range</TableHead>
              <TableHead className="text-right">n</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ORDER.map((t) => {
              const p = TYPOLOGY_PRIORS[t];
              const lo = Math.exp(p.costMu - 1.28 * p.costSigma);
              const hi = Math.exp(p.costMu + 1.28 * p.costSigma);
              return (
                <TableRow key={t}>
                  <TableCell className="font-medium">{p.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.medianTurns}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${p.medianCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    ${lo.toFixed(lo < 10 ? 2 : 0)}–${hi.toFixed(hi < 10 ? 2 : 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {p.n}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Fitted to 544 real Claude Code conversations (~90% Opus-4.8). Costs
          re-scale by model; the ordering and shape are properties of agentic
          loops. Thin samples (refactor n=7, deploy n=6) are directional.
        </p>
      </CardContent>
    </Card>
  );
}
