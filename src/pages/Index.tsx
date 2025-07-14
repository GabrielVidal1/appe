import { ConfigNameDisplay } from "@/components/ConfigNameDisplay";
import EstimatorForm from "@/components/EstimatorForm";
import Footer from "@/components/Footer";
import LeftSideContent from "@/components/LeftHero";
import Navbar from "@/components/Navbar";
import ResultsTable from "@/components/ResultsTable";
import { useAppData } from "@/hooks/useAppData";
import { cn } from "@/lib/utils";
import { AppData } from "@/types/appData";
import { useCallback, useEffect, useRef, useState } from "react";

const Index = () => {
  const { isConfigFromUrl, appData, urlConfig } = useAppData();
  const [resultsLoaded, setResultsLoaded] = useState(isConfigFromUrl);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = useCallback((data: AppData) => {
    setResultsLoaded(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, []);

  useEffect(() => {
    // If the form is pre-filled from URL, scroll to results
    if (isConfigFromUrl && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 1000);
    }
  }, [isConfigFromUrl]);

  return (
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
        <div className="group w-full h-full overflow-y-scroll lg:w-2/3 bg-white dark:bg-gray-900 flex flex-col">
          <div className="min-h-full h-fit flex flex-col">
            <div className="p-6 h-fit flex flex-col gap-20 flex-1 mb-20">
              <div>
                {/* <SharedConfigNotification /> */}
                <ConfigNameDisplay />
                <EstimatorForm
                  onSubmit={handleFormSubmit}

                  // updatePrices={!!currentConfig}
                />
              </div>
              {(resultsLoaded || isConfigFromUrl) && (
                <div ref={resultsRef}>
                  <ResultsTable configFromUrl={urlConfig} />
                </div>
              )}
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
