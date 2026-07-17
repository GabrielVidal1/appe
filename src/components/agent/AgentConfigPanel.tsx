import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AGENT_DEFAULTS,
  AGENT_PRESETS,
  AgentComplexity,
  AgentRunConfig,
  AgentTypology,
  COMPLEXITY_PRESETS,
  TYPOLOGY_PRIORS,
} from "@appe/core";
import { ChevronDown, Sliders } from "lucide-react";

export type AgentConfigState = Required<
  Pick<
    AgentRunConfig,
    | "turns"
    | "toolsPerTurn"
    | "baseContextTokens"
    | "contextGrowthPerTurn"
    | "outputTokensPerTurn"
    | "cacheHitRate"
    | "reasoning"
    | "runs"
  >
> & { typology: AgentTypology | null; complexity: AgentComplexity | null };

export const DEFAULT_AGENT_CONFIG: AgentConfigState = {
  turns: 120,
  toolsPerTurn: AGENT_DEFAULTS.toolsPerTurn,
  baseContextTokens: AGENT_DEFAULTS.baseContextTokens,
  contextGrowthPerTurn: AGENT_DEFAULTS.contextGrowthPerTurn,
  outputTokensPerTurn: AGENT_DEFAULTS.outputTokensPerTurn,
  cacheHitRate: AGENT_DEFAULTS.cacheHitRate,
  reasoning: false,
  runs: 1,
  typology: "feature",
  complexity: null,
};

const TYPOLOGY_KEYS = Object.keys(TYPOLOGY_PRIORS) as AgentTypology[];
const COMPLEXITY_KEYS = Object.keys(COMPLEXITY_PRESETS) as AgentComplexity[];

interface Props {
  config: AgentConfigState;
  onChange: (patch: Partial<AgentConfigState>) => void;
}

export default function AgentConfigPanel({ config, onChange }: Props) {
  const pickTypology = (t: AgentTypology) =>
    onChange({
      typology: t,
      complexity: null,
      turns: TYPOLOGY_PRIORS[t].medianTurns,
    });

  const pickComplexity = (c: AgentComplexity) =>
    onChange({
      complexity: c,
      typology: null,
      turns: COMPLEXITY_PRESETS[c].turns,
      toolsPerTurn: COMPLEXITY_PRESETS[c].toolsPerTurn,
    });

  const pickPreset = (cfg: AgentRunConfig) =>
    onChange({
      ...DEFAULT_AGENT_CONFIG,
      ...cfg,
      typology: null,
      complexity: null,
    } as Partial<AgentConfigState>);

  return (
    <div className="space-y-6">
      {/* Typology */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Task type
        </Label>
        <div className="flex flex-wrap gap-2">
          {TYPOLOGY_KEYS.map((t) => (
            <button
              key={t}
              onClick={() => pickTypology(t)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                config.typology === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              )}
              title={TYPOLOGY_PRIORS[t].note}
            >
              {TYPOLOGY_PRIORS[t].label}
            </button>
          ))}
        </div>
        {config.typology && (
          <p className="text-xs text-muted-foreground">
            {TYPOLOGY_PRIORS[config.typology].note} Corpus median{" "}
            {TYPOLOGY_PRIORS[config.typology].medianTurns} msgs · $
            {TYPOLOGY_PRIORS[config.typology].medianCost.toFixed(2)} (n=
            {TYPOLOGY_PRIORS[config.typology].n}).
          </p>
        )}
      </div>

      {/* Complexity */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          …or by complexity
        </Label>
        <div className="flex flex-wrap gap-2">
          {COMPLEXITY_KEYS.map((c) => (
            <button
              key={c}
              onClick={() => pickComplexity(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                config.complexity === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              )}
              title={COMPLEXITY_PRESETS[c].note}
            >
              {COMPLEXITY_PRESETS[c].label}
            </button>
          ))}
        </div>
      </div>

      {/* Turns — the dominant lever */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="turns" className="text-sm font-medium">
            AI messages (turns)
          </Label>
          <span className="text-lg font-semibold tabular-nums">
            {config.turns}
          </span>
        </div>
        <Slider
          id="turns"
          min={1}
          max={500}
          step={1}
          value={[config.turns]}
          onValueChange={([v]) =>
            onChange({ turns: v, typology: null, complexity: null })
          }
        />
        <p className="text-xs text-muted-foreground">
          The dominant cost lever — cost grows super-linearly with turns
          (≈&nbsp;N<sup>1.2</sup>), because each turn re-reads the growing
          context.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Presets
        </Label>
        <div className="flex flex-wrap gap-2">
          {AGENT_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => pickPreset(p.config)}
              className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
              title={p.note}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2">
            <Sliders className="h-4 w-4" />
            Advanced levers
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4 rounded-lg border border-border p-4">
          <NumberField
            label="Tools / turn"
            value={config.toolsPerTurn}
            step={0.1}
            onChange={(v) => onChange({ toolsPerTurn: v })}
            hint="Median 0.49"
          />
          <NumberField
            label="Base context (tokens)"
            value={config.baseContextTokens}
            step={1000}
            onChange={(v) => onChange({ baseContextTokens: v })}
            hint="System + tools + repo loaded up front"
          />
          <NumberField
            label="Context growth / turn (tokens)"
            value={config.contextGrowthPerTurn}
            step={50}
            onChange={(v) => onChange({ contextGrowthPerTurn: v })}
            hint="Appended each turn — drives the super-linear term"
          />
          <NumberField
            label="Output / turn (tokens)"
            value={config.outputTokensPerTurn}
            step={50}
            onChange={(v) => onChange({ outputTokensPerTurn: v })}
          />
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-sm">Cache-hit rate</Label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(config.cacheHitRate * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(config.cacheHitRate * 100)]}
              onValueChange={([v]) => onChange({ cacheHitRate: v / 100 })}
            />
            <p className="text-xs text-muted-foreground">
              Share of the prefix served as a cheap cache-read. Measured median
              96% — prompt caching is what makes agents affordable.
            </p>
          </div>
          <NumberField
            label="Runs (batch of identical runs)"
            value={config.runs}
            step={1}
            min={1}
            onChange={(v) => onChange({ runs: Math.max(1, v) })}
          />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Reasoning model</Label>
              <p className="text-xs text-muted-foreground">
                Bills thinking tokens as output (×
                {AGENT_DEFAULTS.reasoningOutputMultiplier} output/turn).
              </p>
            </div>
            <Switch
              checked={config.reasoning}
              onCheckedChange={(v) => onChange({ reasoning: v })}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(DEFAULT_AGENT_CONFIG)}
          >
            Reset to empirical defaults
          </Button>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-wrap gap-2 pt-2">
        <Badge variant="secondary" className="font-normal">
          {config.runs > 1
            ? `${config.runs.toLocaleString()} runs × ${config.turns} turns`
            : `${config.turns} turns`}
        </Badge>
        {config.reasoning && (
          <Badge variant="secondary" className="font-normal">
            reasoning
          </Badge>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{label}</Label>
        <Input
          type="number"
          className="h-8 w-32 text-right tabular-nums"
          value={value}
          step={step}
          min={min}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) onChange(v);
          }}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
