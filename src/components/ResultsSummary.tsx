import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { calculatePricing, estimateTokens } from "@/lib/computations";
import { useMemo } from "react";

interface ResultsSummaryProps {
  data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    example: string;
    imageSize?: { width: number; height: number };
  };
}

const ResultsSummary = ({ data }: ResultsSummaryProps) => {
  const summaryData = useMemo(() => {
    const tokenEstimates = estimateTokens(
      data.dataType,
      data.prompt,
      data.example,
      data.imageSize
    );

    const results = calculatePricing({
      dataCount: data.dataCount,
      inputTokensPerItem: tokenEstimates.input,
      outputTokensPerItem: tokenEstimates.output,
    });

    const totalInputTokens = tokenEstimates.input * data.dataCount;
    const totalOutputTokens = tokenEstimates.output * data.dataCount;
    const totalTokens = totalInputTokens + totalOutputTokens;

    const minResult = results.reduce((prev, curr) =>
      curr.totalCost < prev.totalCost ? curr : prev
    );
    const maxResult = results.reduce((prev, curr) =>
      curr.totalCost > prev.totalCost ? curr : prev
    );

    return {
      tokenEstimates,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      minCost: minResult.totalCost,
      maxCost: maxResult.totalCost,
      minModel: minResult.model.model,
      maxModel: maxResult.model.model,
      modelCount: results.length,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Tokens</div>
            <div className="text-2xl font-bold text-purple-600">
              {summaryData.totalTokens.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Price Range</div>
            <div className="text-2xl font-bold text-orange-600">
              ${summaryData.minCost.toFixed(2)} ({summaryData.minModel}){" "}
              <p>|</p>
              {summaryData.maxCost.toFixed(2)} ({summaryData.maxModel})
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Badge variant="secondary">
            Comparing {summaryData.modelCount} models for{" "}
            {data.dataCount.toLocaleString()} {data.dataType}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
export default ResultsSummary;
