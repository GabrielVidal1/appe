import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import AgentConfigPanel, {
  AgentConfigState,
  DEFAULT_AGENT_CONFIG,
} from "@/components/agent/AgentConfigPanel";
import AgentCostCurve from "@/components/agent/AgentCostCurve";
import AgentCostHeadline from "@/components/agent/AgentCostHeadline";
import AgentModelTable from "@/components/agent/AgentModelTable";
import AgentTokenBreakdown from "@/components/agent/AgentTokenBreakdown";
import AgentTypologyReference from "@/components/agent/AgentTypologyReference";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ALL_MODELS_BY_ID,
  ALL_TEXT_MODELS,
  Model,
  estimateAgentRun,
} from "@appe/core";
import { FlaskConical, X } from "lucide-react";
import { useMemo, useState } from "react";

/** Default model: Claude Opus 4.8 (the corpus the model was fitted on), else
 *  the first catalogue model. */
function defaultModel(): Model {
  return (
    ALL_MODELS_BY_ID["anthropic/claude-opus-4-8"] ??
    ALL_TEXT_MODELS.find((m) => /opus/.test(m.id)) ??
    ALL_TEXT_MODELS[0]
  );
}

export default function AgentEstimator() {
  const [config, setConfig] = useState<AgentConfigState>(DEFAULT_AGENT_CONFIG);
  const [model, setModel] = useState<Model>(defaultModel);
  const [betaOpen, setBetaOpen] = useState(true);

  const patch = (p: Partial<AgentConfigState>) =>
    setConfig((c) => ({ ...c, ...p }));

  const result = useMemo(
    () => estimateAgentRun(config, model),
    [config, model]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar className="sticky top-0 z-50" />

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">
        {/* Beta banner */}
        {betaOpen && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-950/30">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <span className="font-medium">Beta — agentic cost estimation.</span>{" "}
              An agent run is a loop with a growing context, not a single prompt.
              This estimator models that mechanism, grounded in{" "}
              <span className="font-medium">544 real Claude Code runs</span>. The
              uncertainty band is real: agent cost is genuinely spread, dominated
              by turn count.
            </div>
            <button
              onClick={() => setBetaOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Agentic run estimator
          </h1>
          <p className="mt-1 text-muted-foreground">
            What does an <em>agent run</em> cost — a loop of N turns with growing
            context, tool results fed back, cache hits on the prefix? Compare
            across every provider.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* Left: config */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Describe the run</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentConfigPanel config={config} onChange={patch} />
              </CardContent>
            </Card>
          </div>

          {/* Right: results */}
          <div className="space-y-6">
            <AgentCostHeadline result={result} />
            <div className="grid gap-6 md:grid-cols-2">
              <AgentCostCurve config={config} model={model} />
              <AgentTokenBreakdown result={result} />
            </div>
            <AgentModelTable
              config={config}
              selectedId={model.id}
              onSelect={setModel}
            />
            <AgentTypologyReference />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
