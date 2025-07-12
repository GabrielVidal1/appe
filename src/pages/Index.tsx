import EstimatorForm from "@/components/EstimatorForm";
import Footer from "@/components/Footer";
import LeftSideContent from "@/components/LeftHero";
import Navbar from "@/components/Navbar";
import ResultsTable from "@/components/ResultsTable";
import FormContextProvider from "@/contexts/form/FormContextProvider";
import { FormDataContext } from "@/contexts/form/type";
import { cn } from "@/lib/utils";
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
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <FormContextProvider>
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        <Navbar className="sticky top-0 z-50" />

        <div className="flex-1 flex overflow-hidden bg-white dark:bg-gray-900">
          {/* Left Side */}
          <div
            className={cn(
              "w-1/3 bg-gradient-to-br from-blue-50 to-indigo-100 hidden lg:block dark:from-gray-800 dark:to-gray-900"
            )}
          >
            <LeftSideContent />
          </div>

          {/* Right Side */}
          <div className="w-full h-full overflow-y-scroll lg:w-2/3 bg-white dark:bg-gray-900 flex flex-col">
            <div className="min-h-full h-fit flex flex-col">
              <div className="p-6 h-fit flex flex-col gap-20 flex-1 mb-20">
                <EstimatorForm onSubmit={handleFormSubmit} />
                {estimationData && (
                  <div ref={resultsRef}>
                    <ResultsTable data={estimationData} />
                  </div>
                )}
              </div>
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </FormContextProvider>
  );
};

export default Index;
