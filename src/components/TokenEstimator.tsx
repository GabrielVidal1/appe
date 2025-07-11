import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { estimateTokens } from "@/lib/computations";
import { useMemo } from "react";

interface TokenEstimatorProps {
  dataType: string;
  prompt: string;
  example: string;
  imageSize?: { width: number; height: number };
  dataCount: number;
}

const TokenEstimator = ({
  dataType,
  prompt,
  example,
  imageSize,
  dataCount,
}: TokenEstimatorProps) => {
  const tokenStats = useMemo(() => {
    if (!prompt?.trim()) return null;

    const tokenEstimates = estimateTokens(
      dataType,
      prompt,
      example,
      dataType === "images" ? imageSize : undefined
    );

    const totalInputTokens = dataCount * tokenEstimates.input;
    const totalOutputTokens = dataCount * tokenEstimates.output;
    const totalTokens = totalInputTokens + totalOutputTokens;

    return {
      singleItemInput: tokenEstimates.input,
      singleItemOutput: tokenEstimates.output,
      singleItemTotal: tokenEstimates.input + tokenEstimates.output,
      totalInput: totalInputTokens,
      totalOutput: totalOutputTokens,
      totalTokens,
    };
  }, [dataType, prompt, example, imageSize, dataCount]);

  if (!tokenStats) {
    return null;
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-center">
          Token Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Single Item</div>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between">
                <span>Input:</span>
                <span className="font-mono">
                  {tokenStats.singleItemInput.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Output:</span>
                <span className="font-mono">
                  {tokenStats.singleItemOutput.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="font-mono">
                  {tokenStats.singleItemTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">
              All Items ({dataCount.toLocaleString()})
            </div>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between">
                <span>Input:</span>
                <span className="font-mono">
                  {tokenStats.totalInput.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Output:</span>
                <span className="font-mono">
                  {tokenStats.totalOutput.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="font-mono">
                  {tokenStats.totalTokens.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenEstimator;
