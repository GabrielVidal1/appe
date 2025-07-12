import { Card, CardContent } from "@/components/ui/card";
import { FormDataContext } from "@/contexts/form/type";
import {
  ALL_MODELS,
  calculatePricing,
  estimateTokens,
} from "@/lib/computations";
import { Model } from "@/lib/types";
import { useMemo } from "react";
import { getProviderIcon } from "./ProviderIcons";

interface ResultsSummaryProps {
  models?: Model[];
  data: FormDataContext;
}

const ResultsSummary = ({ data, models: modelsProp }: ResultsSummaryProps) => {
  const models = modelsProp || ALL_MODELS;

  const summaryData = useMemo(() => {
    const tokenEstimates = estimateTokens(
      data.dataType,
      data.prompt,
      data.example,
      data.imageSize
    );

    const results = calculatePricing(models, {
      dataCount: data.dataCount,
      inputTokensPerItem: tokenEstimates.input,
      outputTokensPerItem: tokenEstimates.output,
    });

    const totalInputTokens = tokenEstimates.input * data.dataCount;
    const totalOutputTokens = tokenEstimates.output * data.dataCount;
    const totalTokens = totalInputTokens + totalOutputTokens;

    const minResult = results.reduce(
      (prev, curr) =>
        prev ? (curr.totalCost < prev.totalCost ? curr : prev) : curr,
      null
    );
    const maxResult = results.reduce(
      (prev, curr) =>
        prev ? (curr.totalCost > prev.totalCost ? curr : prev) : curr,
      null
    );

    return {
      tokenEstimates,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      minCost: minResult?.totalCost,
      maxCost: maxResult?.totalCost,
      minModel: minResult?.model,
      maxModel: maxResult?.model,
      modelCount: results.length,
    };
  }, [data]);

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-6">
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Tokens</div>
            <div className="text-2xl font-bold text-purple-600">
              {summaryData.totalTokens.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 text-left">Price Range</div>
            <div className="text-2xl font-bold text-orange-600">
              <span className="flex items-center gap-4">
                <p className="">
                  {"$" + summaryData.minCost.toFixed(2).padStart(5, " ")}
                </p>
                <p className="flex items-center gap-2 text-base text-gray-700">
                  {getProviderIcon(summaryData.minModel.provider)}{" "}
                  {summaryData.minModel.model}
                </p>
              </span>
              <p className="text-left">|</p>
              <span className="flex items-center gap-4">
                <p className="">
                  {"$" + summaryData.maxCost.toFixed(2).padStart(5, " ")}
                </p>
                <p className="flex items-center gap-2 text-base text-gray-700">
                  {getProviderIcon(summaryData.maxModel.provider)}{" "}
                  {summaryData.maxModel.model}
                </p>
              </span>
            </div>
          </div>
        </div>
        {/* <div className="mt-4 text-center">
          <Badge variant="secondary">
            Comparing {summaryData.modelCount} models for{" "}
            {data.dataCount.toLocaleString()} {data.dataType}
          </Badge>
        </div> */}
      </CardContent>
    </Card>
  );
};
export default ResultsSummary;
