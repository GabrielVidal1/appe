import { Model } from "@/types/model";
import { getProviderIcon } from "./ProviderIcons";

interface ResultsPriceRangeProps {
  summaryData: {
    minMax: {
      minIsMax: boolean;
      minModel: Model;
      min: number;
      maxModel: Model;
      max: number;
    };
  };
}

const ResultsPriceRange: React.FC<ResultsPriceRangeProps> = ({
  summaryData,
}) => {
  return (
    <div className="text-center flex flex-col justify-center">
      <div className="text-sm text-gray-600 text-left">
        {summaryData.minMax.minIsMax ? "Estimated Price" : "Price Range"}
      </div>
      <div className="text-2xl font-bold text-orange-600 text-nowrap">
        <span className="flex items-center gap-4">
          <p className="text-green-600 ">
            {"$" + summaryData.minMax.min.toFixed(2).padStart(5, " ")}
          </p>
          <p className="flex items-center gap-2 text-base text-gray-700">
            {getProviderIcon(summaryData.minMax.minModel.provider)}{" "}
            {summaryData.minMax.minModel.name}
          </p>
        </span>
        {!summaryData.minMax.minIsMax && (
          <>
            <p className="text-left bg-gradient-to-b from-green-500 to-red-500 w-[1px] h-8 mx-[7px]">
              {" "}
            </p>
            <span className="flex items-center gap-4">
              <p className="text-red-600">
                {"$" + summaryData.minMax.max.toFixed(2).padStart(5, " ")}
              </p>
              <p className="flex items-center gap-2 text-base text-gray-700">
                {getProviderIcon(summaryData.minMax.maxModel.provider)}{" "}
                {summaryData.minMax.maxModel.name}
              </p>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPriceRange;
