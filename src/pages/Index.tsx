
import { useState } from "react";
import EstimatorForm from "@/components/EstimatorForm";
import ResultsTable from "@/components/ResultsTable";
import { Brain, Calculator, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EstimationData {
  dataCount: number;
  dataType: string;
  prompt: string;
  examples: string[];
  imageSize?: { width: number; height: number };
}

const Index = () => {
  const [estimationData, setEstimationData] = useState<EstimationData | null>(null);

  const handleFormSubmit = (data: EstimationData) => {
    setEstimationData(data);
  };

  const LeftSideContent = () => (
    <div className="flex flex-col justify-center h-full p-8">
      <div className="max-w-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          AI Cost Estimator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Compare pricing across major AI providers and find the most cost-effective solution for your data processing needs.
        </p>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Brain className="text-blue-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold mb-1">Multiple AI Models</h3>
              <p className="text-gray-600 text-sm">Compare small, medium, and large models across different providers</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Calculator className="text-green-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold mb-1">Accurate Estimates</h3>
              <p className="text-gray-600 text-sm">Get precise cost calculations based on your specific requirements</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <TrendingUp className="text-purple-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold mb-1">Best Value</h3>
              <p className="text-gray-600 text-sm">Find the most cost-effective solution for your budget and needs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
