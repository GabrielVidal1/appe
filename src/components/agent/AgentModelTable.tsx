import { ProviderIcon } from "@/components/ProviderIcons";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ALL_TEXT_MODELS,
  AgentRunConfig,
  Model,
  estimateAgentRun,
} from "@appe/core";
import { useMemo, useState } from "react";
import { money } from "./format";

const TIERS = ["small", "medium", "big"] as const;
const MAX_ROWS = 60;

/** Rank every catalogue model by the cost of the SAME agent run — the "compare
 *  every provider" promise, carried over to agent workflows. */
export default function AgentModelTable({
  config,
  selectedId,
  onSelect,
}: {
  config: AgentRunConfig;
  selectedId: string;
  onSelect: (m: Model) => void;
}) {
  const [tier, setTier] = useState<string>("all");
  const [providerQuery, setProviderQuery] = useState("");

  const ranked = useMemo(() => {
    return ALL_TEXT_MODELS.filter((m) => {
      if (tier !== "all" && m.tier !== tier) return false;
      if (
        providerQuery &&
        !m.provider.toLowerCase().includes(providerQuery.toLowerCase()) &&
        !m.name.toLowerCase().includes(providerQuery.toLowerCase())
      )
        return false;
      // hide models with no output price (embedders/free) — noise in a cost sort
      return m.output_cost > 0;
    })
      .map((m) => ({ m, cost: estimateAgentRun(config, m).cost.total }))
      .sort((a, b) => a.cost - b.cost);
  }, [config, tier, providerQuery]);

  const shown = ranked.slice(0, MAX_ROWS);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">
          Cost of this run on every model
        </h3>
        <span className="text-xs text-muted-foreground">
          {ranked.length.toLocaleString()} models · click to select
        </span>
        <div className="ml-auto flex items-center gap-2">
          <input
            placeholder="Filter provider…"
            value={providerQuery}
            onChange={(e) => setProviderQuery(e.target.value)}
            className="h-8 w-36 rounded-md border border-border bg-background px-2 text-sm"
          />
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {TIERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-[28rem] overflow-y-auto rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="hidden sm:table-cell">Tier</TableHead>
              <TableHead className="text-right">In/Out $/M</TableHead>
              <TableHead className="text-right">Run cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map(({ m, cost }, i) => (
              <TableRow
                key={m.id}
                onClick={() => onSelect(m)}
                className={cn(
                  "cursor-pointer",
                  m.id === selectedId && "bg-primary/10"
                )}
              >
                <TableCell className="text-muted-foreground tabular-nums">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ProviderIcon provider={m.provider} className="h-4 w-4" />
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.provider}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="font-normal">
                    {m.tier}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                  ${m.input_cost}/${m.output_cost}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(cost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {ranked.length > MAX_ROWS && (
        <p className="text-xs text-muted-foreground">
          Showing the {MAX_ROWS} cheapest of {ranked.length.toLocaleString()} —
          filter to narrow.
        </p>
      )}
    </div>
  );
}
