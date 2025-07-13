import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ALL_TEXT_MODELS } from "@/data";
import { computePrices, computeTokens } from "@/lib/computations";
import { tokensToRealWorldText } from "@/lib/format";
import { AppData } from "@/types/appData";
import { Model } from "@/types/model";
import { Info, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import ExportModal from "./ExportModal";
import { getProviderIcon } from "./ProviderIcons";
import TokenBreakdownPopover from "./TokenBreakdownPopover";

interface ResultsSummaryProps {
  models?: Model[];
  data: AppData;
}

const ResultsSummary = ({ data, models: modelsProp }: ResultsSummaryProps) => {
  const models = modelsProp || ALL_TEXT_MODELS;
  const [exportModalOpen, setExportModalOpen] = useState(false);

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
      minCost: minResult?.totalCost,
      maxCost: maxResult?.totalCost,
      minModel: minResult?.model,
      maxModel: maxResult?.model,
      modelCount: models.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <>
      <Card className="relative">
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExportModalOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-6">
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
            <div className="text-center">
              <div className="text-sm text-gray-600 text-left">Price Range</div>
              <div className="text-2xl font-bold text-orange-600">
                <span className="flex items-center gap-4">
                  <p className="text-green-600">
                    {"$" + summaryData.minCost.toFixed(2).padStart(5, " ")}
                  </p>
                  <p className="flex items-center gap-2 text-base text-gray-700">
                    {getProviderIcon(summaryData.minModel.provider)}{" "}
                    {summaryData.minModel.name}
                  </p>
                </span>
                <p className="text-left bg-gradient-to-b from-green-500 to-red-500 w-[1px] h-8 mx-[7px]">
                  {" "}
                </p>
                <span className="flex items-center gap-4">
                  <p className="text-red-600">
                    {"$" + summaryData.maxCost.toFixed(2).padStart(5, " ")}
                  </p>
                  <p className="flex items-center gap-2 text-base text-gray-700">
                    {getProviderIcon(summaryData.maxModel.provider)}{" "}
                    {summaryData.maxModel.name}
                  </p>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        data={data}
        minCost={summaryData.minCost}
        maxCost={summaryData.maxCost}
        minModel={summaryData.minModel.name}
        maxModel={summaryData.maxModel.name}
      />
    </>
  );
};

export default ResultsSummary;
