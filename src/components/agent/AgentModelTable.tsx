import ProviderCombobox from "@/components/ProviderCombobox";
import { ProviderIcon } from "@/components/ProviderIcons";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  formatDuration,
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
  const [provider, setProvider] = useState<string>("all");
  const [nameQuery, setNameQuery] = useState("");
  const [sortBy, setSortBy] = useState<"cost" | "time">("cost");

  const ranked = useMemo(() => {
    return ALL_TEXT_MODELS.filter((m) => {
      if (tier !== "all" && m.tier !== tier) return false;
      if (provider !== "all" && m.provider !== provider) return false;
      if (
        nameQuery &&
        !m.name.toLowerCase().includes(nameQuery.toLowerCase())
      )
        return false;
      // hide models with no output price (embedders/free) — noise in a cost sort
      return m.output_cost > 0;
    })
      .map((m) => {
        const r = estimateAgentRun(config, m);
        return { m, cost: r.cost.total, time: r.durationSeconds };
      })
      .sort((a, b) => (sortBy === "time" ? a.time - b.time : a.cost - b.cost));
  }, [config, tier, provider, nameQuery, sortBy]);

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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search model…"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="h-8 w-36"
          />
          <ProviderCombobox
            value={provider}
            onChange={setProvider}
            className="h-8 w-40 sm:w-40"
            placeholder="Filter by provider"
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
              <TableHead
                className="cursor-pointer select-none text-right hover:text-foreground"
                onClick={() => setSortBy("time")}
                title="Estimated model generation time — click to sort"
              >
                Time{sortBy === "time" ? " ↓" : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right hover:text-foreground"
                onClick={() => setSortBy("cost")}
                title="Run cost — click to sort"
              >
                Run cost{sortBy === "cost" ? " ↓" : ""}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map(({ m, cost, time }, i) => (
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
                <TableCell
                  className="text-right tabular-nums text-muted-foreground"
                  title={
                    m.speed_source === "estimated"
                      ? `~${m.speed_tps} tok/s (tier-estimated)`
                      : `${m.speed_tps} tok/s (measured)`
                  }
                >
                  {formatDuration(time)}
                  {m.speed_source === "estimated" && (
                    <span className="ml-0.5 text-[10px]">*</span>
                  )}
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
          Showing the {MAX_ROWS} {sortBy === "time" ? "fastest" : "cheapest"} of{" "}
          {ranked.length.toLocaleString()} — filter to narrow.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Time is the model's generation wall-clock (tokens ÷ output speed +
        latency). <span className="tabular-nums">*</span> = speed tier-estimated;
        unmarked models use{" "}
        <a
          href="https://artificialanalysis.ai/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          Artificial Analysis
        </a>{" "}
        measurements.
      </p>
    </div>
  );
}
