import { ALL_TEXT_MODELS } from "@/data";
import { computePrices, computeTokens } from "@/lib/computations";
import { AppData } from "@/types/appData";
import { Model } from "@/types/model";
import { chain } from "lodash";
import { useMemo } from "react";
import { getProviderIcon } from "./ProviderIcons";

interface PriceBarChartWidgetProps {
  data: AppData;
  models?: Model[];
}

const PriceBarChartWidget = ({
  data,
  models: modelsProp,
}: PriceBarChartWidgetProps) => {
  const models = modelsProp || ALL_TEXT_MODELS;

  const chartData = useMemo(() => {
    // Calculate pricing for all models
    const results = chain(models)
      .map((model) => {
        const tokenResults = computeTokens(data, model);
        return computePrices(data, model, tokenResults);
      })
      .sortBy("totalCost")
      .value();

    const maxCost = Math.max(...results.map((r) => r.totalCost));

    return results.map((result) => ({
      ...result,
      widthPercentage: (result.totalCost / maxCost) * 100,
    }));
  }, [data, models]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Price Comparison</h3>
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div
            key={`${item.model.provider}-${item.model.name}`}
            className="space-y-1"
          >
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center h-5">
                  {getProviderIcon(item.model.provider)}
                </span>
                <span className="font-medium leading-none">
                  {item.model.name}
                </span>
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

export default PriceBarChartWidget;
