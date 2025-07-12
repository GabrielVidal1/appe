
import { useMemo } from "react";
import { FormDataContext } from "@/contexts/form/type";
import { ALL_MODELS, calculatePricing, estimateTokens } from "@/lib/computations";
import { Model } from "@/lib/types";
import { getProviderIcon } from "./ProviderIcons";

interface PriceRangeWidgetProps {
  data: FormDataContext;
  models?: Model[];
}

const PriceRangeWidget = ({ data, models: modelsProp }: PriceRangeWidgetProps) => {
  const models = modelsProp || ALL_MODELS;

  const chartData = useMemo(() => {
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

    // Group by provider and select up to 1 model per provider, max 5 total
    const providerGroups: { [provider: string]: typeof results } = {};
    
    results.forEach((result) => {
      if (!providerGroups[result.model.provider]) {
        providerGroups[result.model.provider] = [];
      }
      providerGroups[result.model.provider].push(result);
    });

    // Get one model per provider (cheapest from each)
    const selectedResults = Object.values(providerGroups)
      .map(group => group.sort((a, b) => a.totalCost - b.totalCost)[0])
      .sort((a, b) => a.totalCost - b.totalCost)
      .slice(0, 5); // Max 5 models

    const maxCost = Math.max(...selectedResults.map(r => r.totalCost));

    return selectedResults.map(result => ({
      ...result,
      widthPercentage: (result.totalCost / maxCost) * 100,
    }));
  }, [data, models]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Price Comparison</h3>
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={`${item.model.provider}-${item.model.model}`} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                {getProviderIcon(item.model.provider)}
                <span className="font-medium">{item.model.model}</span>
              </div>
              <span className="font-bold text-green-600">
                ${item.totalCost.toFixed(2)}
              </span>
            </div>
            <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${item.widthPercentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceRangeWidget;
