import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ImportDataStage } from "@/components/ai-processing/ImportDataStage";
import { TemplateStage } from "@/components/ai-processing/TemplateStage";
import { RunStage } from "@/components/ai-processing/RunStage";
import { ResultsStage } from "@/components/ai-processing/ResultsStage";
import { StageIndicator } from "@/components/ai-processing/StageIndicator";

export type ProcessingStage = "import" | "template" | "run" | "results";

interface ProcessingData {
  importedData?: any[];
  templates?: any;
  email?: string;
  results?: any;
}

const AIProcessing = () => {
  const [currentStage, setCurrentStage] = useState<ProcessingStage>("import");
  const [processingData, setProcessingData] = useState<ProcessingData>({});

  const stages = [
    { id: "import", title: "Import Data", description: "Upload CSV or ZIP files" },
    { id: "template", title: "Templates", description: "Set up prompts and examples" },
    { id: "run", title: "Process", description: "Run AI processing" },
    { id: "results", title: "Results", description: "View and export results" },
  ] as const;

  const handleStageComplete = (stage: ProcessingStage, data: any) => {
    setProcessingData(prev => ({ ...prev, ...data }));
    
    const currentIndex = stages.findIndex(s => s.id === stage);
    if (currentIndex < stages.length - 1) {
      setCurrentStage(stages[currentIndex + 1].id);
    }
  };

  const renderCurrentStage = () => {
    switch (currentStage) {
      case "import":
        return (
          <ImportDataStage
            onComplete={(data) => handleStageComplete("import", { importedData: data })}
          />
        );
      case "template":
        return (
          <TemplateStage
            importedData={processingData.importedData}
            onComplete={(data) => handleStageComplete("template", { templates: data })}
          />
        );
      case "run":
        return (
          <RunStage
            importedData={processingData.importedData}
            templates={processingData.templates}
            onComplete={(data) => handleStageComplete("run", { email: data.email, results: data.results })}
          />
        );
      case "results":
        return (
          <ResultsStage
            results={processingData.results}
            email={processingData.email}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar className="sticky top-0 z-50" />
      
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-6 h-full flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Processing</h1>
            <p className="text-muted-foreground">
              Process your data with AI in 4 simple stages
            </p>
          </div>

          <StageIndicator 
            stages={stages} 
            currentStage={currentStage} 
            onStageClick={setCurrentStage}
          />

          <div className="flex-1 mt-8 overflow-auto">
            {renderCurrentStage()}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AIProcessing;