import EstimatorForm from "@/components/EstimatorForm";
import LeftSideContent from "@/components/LeftHero";
import ResultsTable from "@/components/ResultsTable";
import FormContextProvider from "@/contexts/form/FormContextProvider";
import { FormDataContext } from "@/contexts/form/type";
import { useState } from "react";

const Index = () => {
  const [estimationData, setEstimationData] = useState<FormDataContext | null>(
    null
  );

  const handleFormSubmit = (data: FormDataContext) => {
    setEstimationData(data);
  };

  return (
    <FormContextProvider>
      <div className="h-screen flex bg-white overflow-hidden">
        {/* Left Side */}
        <div className="w-1/3 bg-gradient-to-br from-blue-50 to-indigo-100 hidden lg:block">
          <LeftSideContent />
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-2/3 bg-white">
          <div className="h-full p-6 overflow-y-auto flex flex-col gap-4">
            <EstimatorForm onSubmit={handleFormSubmit} />
            {estimationData && <ResultsTable data={estimationData} />}
          </div>
        </div>
      </div>
    </FormContextProvider>
  );
};

export default Index;
