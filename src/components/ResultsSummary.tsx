import { Card, CardContent } from "@/components/ui/card";
import { ALL_TEXT_MODELS } from "@/data";
import { useAppData } from "@/hooks/useAppData";
import { computePrices, computeTokens } from "@/lib/computations";
import { tokensToRealWorldText } from "@/lib/format";
import { Model } from "@/types/model";
import { Info } from "lucide-react";
import { useMemo } from "react";
import ResultsPriceRange from "./ResultsPriceRange";
import TokenBreakdownPopover from "./TokenBreakdownPopover";

interface ResultsSummaryProps {
  models?: Model[];
}

const ResultsSummary = ({ models: modelsProp }: ResultsSummaryProps) => {
  const { appData: data } = useAppData();

  const models = modelsProp || ALL_TEXT_MODELS;

  const summaryData = useMemo(() => {
    const tokenEstimates = models.map((model) => {
      const tokens = computeTokens(data, model);
      const prices = computePrices(data, model, tokens);
      return {
        model,
        ...tokens,
        ...prices,
      };
    });

    const tokenEstimateNoModel = computeTokens(data);

    const totalTokens = tokenEstimateNoModel.totalTokens * data.dataCount;

    const minResult = tokenEstimates.reduce(
      (min, res) => (res.totalCost < min.totalCost ? res : min),
      tokenEstimates[0]
    );
    const maxResult = tokenEstimates.reduce(
      (max, res) => (res.totalCost > max.totalCost ? res : max),
      tokenEstimates[0]
    );

    return {
      tokenEstimateNoModel,
      tokenEstimates,
      totalTokens,
      minMax:
        minResult && maxResult
          ? {
              minIsMax: minResult.model.id === maxResult.model.id,
              minModel: minResult.model,
              min: minResult.totalCost,
              maxModel: maxResult.model,
              max: maxResult.totalCost,
            }
          : undefined,
      modelCount: models.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <>
      <Card className="relative">
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <TokenBreakdownPopover
              data={data}
              results={summaryData.tokenEstimateNoModel}
            >
              <div className="text-center flex flex-col justify-between hover:bg-muted/50 rounded-lg p-2 transition-colors">
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  Total Tokens
                  <Info className="h-3 w-3 opacity-60" />
                </div>
                <div className="text-4xl font-bold text-purple-600">
                  {summaryData.totalTokens.toLocaleString()}
                </div>

                <div className="text-sm text-gray-600">
                  {tokensToRealWorldText(summaryData.totalTokens)}
                </div>
              </div>
            </TokenBreakdownPopover>
            {summaryData.minMax && (
              <ResultsPriceRange summaryData={summaryData} />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ResultsSummary;
