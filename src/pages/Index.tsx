
import { useState } from "react";
import Hero from "@/components/Hero";
import EstimatorForm from "@/components/EstimatorForm";
import ResultsTable from "@/components/ResultsTable";

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
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <Hero />
      
      <div className="container mx-auto px-4 py-16">
        <EstimatorForm onSubmit={handleFormSubmit} />
      </div>

      {estimationData && (
        <div id="results" className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <ResultsTable data={estimationData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
