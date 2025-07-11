
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

    const costs = results.map(r => r.totalCost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);

    return {
      tokenEstimates,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      minCost,
      maxCost,
      modelCount: results.length
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Processing Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summaryData.totalInputTokens.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Input Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summaryData.totalOutputTokens.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Output Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {summaryData.totalTokens.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${summaryData.minCost.toFixed(2)} - ${summaryData.maxCost.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Price Range</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Badge variant="secondary">
            Comparing {summaryData.modelCount} models for {data.dataCount.toLocaleString()} {data.dataType} items
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsSummary;
