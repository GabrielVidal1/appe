
import EstimatorForm from "@/components/EstimatorForm";
import LeftSideContent from "@/components/LeftHero";
import ResultsTable from "@/components/ResultsTable";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FormContextProvider from "@/contexts/form/FormContextProvider";
import { FormDataContext } from "@/contexts/form/type";
import { useRef, useState } from "react";

const Index = () => {
  const [estimationData, setEstimationData] = useState<FormDataContext | null>(
    null
  );
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = (data: FormDataContext) => {
    setEstimationData(data);
    // Scroll to results after a short delay to ensure the component is rendered
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <FormContextProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex bg-white overflow-hidden">
          {/* Left Side */}
          <div className="w-1/3 bg-gradient-to-br from-blue-50 to-indigo-100 hidden lg:block">
            <LeftSideContent />
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-2/3 bg-white">
            <div className="h-full p-6 overflow-y-auto flex flex-col gap-4">
              <EstimatorForm onSubmit={handleFormSubmit} />
              {estimationData && (
                <div ref={resultsRef}>
                  <ResultsTable data={estimationData} />
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </FormContextProvider>
  );
};

export default Index;
