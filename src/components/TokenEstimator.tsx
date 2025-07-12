import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataType } from "@/contexts/form/type";
import { estimateTokens } from "@/lib/computations";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

interface TokenEstimatorProps {
  dataType: DataType;
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
  const [isOpen, setIsOpen] = useState(false);

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
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span>Token Summary</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm mr-9">
                  <span className="opacity-50">Total:</span>
                  <span className="ml-4 font-bold">
                    {tokenStats.totalTokens.toLocaleString()} tokens
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">
                  Single Item
                </div>
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
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="font-mono">
                      {tokenStats.totalTokens.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TokenEstimator;
