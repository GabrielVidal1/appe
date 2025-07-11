
import EstimatorForm from "@/components/EstimatorForm";
import LeftSideContent from "@/components/LeftHero";
import ResultsTable from "@/components/ResultsTable";
import { useState } from "react";

interface EstimationData {
  dataCount: number;
  dataType: string;
  prompt: string;
  example: string;
  imageSize?: { width: number; height: number };
}

const Index = () => {
  const [estimationData, setEstimationData] = useState<EstimationData | null>(
    null
  );

  const handleFormSubmit = (data: EstimationData) => {
    setEstimationData(data);
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Left Side */}
      <div className="w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100">
        {!estimationData ? (
          <LeftSideContent />
        ) : (
          <div className="h-full p-6 overflow-y-auto">
            <EstimatorForm onSubmit={handleFormSubmit} />
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="w-1/2 bg-white">
        {!estimationData ? (
          <div className="h-full p-6 overflow-y-auto">
            <EstimatorForm onSubmit={handleFormSubmit} />
          </div>
        ) : (
          <div className="h-full p-6 overflow-y-auto">
            <ResultsTable data={estimationData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
