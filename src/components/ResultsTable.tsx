import { Card, CardContent } from "@/components/ui/card";
import { ALL_TEXT_MODELS } from "@/data";
import { useAppData } from "@/hooks/useAppData";
import { AppData } from "@/types/appData";
import { useState } from "react";
import BatchPricingToggle from "./BatchPricingToggle";
import ExportModal from "./ExportModal";
import ResultsSummary from "./ResultsSummary";
import ResultsTableFiltered from "./ResultsTableFiltered";

interface ResultsTableProps {
  configFromUrl?: AppData | null;
  className?: string;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ configFromUrl }) => {
  const { appData, watch, setValue } = useAppData();
  const data = configFromUrl ? configFromUrl : appData;

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const batchEnabled = watch("batchEnabled");

  if (!data) return null;

  const models = ALL_TEXT_MODELS.filter((model) => {
    return (
      (data.selectedTiers.length === 0 ||
        data.selectedTiers.includes(model.tier)) &&
      model.tags.some((tag) =>
        data.modelCapabilities.length
          ? data.modelCapabilities.includes(tag)
          : true
      )
    );
  });

  const handleBatchToggle = (checked: boolean) => {
    setValue("batchEnabled", checked);
  };

  return (
    <div className="w-full mx-auto space-y-6">
      <Card>
        <CardContent className="space-y-6 mt-6">
          <div className="flex-col gap-4">
            <div className="flex justify-end items-center space-x-2 mb-4">
              <BatchPricingToggle
                checked={batchEnabled}
                onCheckedChange={handleBatchToggle}
              />
            </div>
            <div className="flex-1 ">
              <ResultsSummary models={models} />
            </div>
          </div>
          <ResultsTableFiltered
            onExport={() => {
              setExportModalOpen(true);
            }}
          />
        </CardContent>
      </Card>
      <ExportModal
        selectedModels={data.selectedModels}
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        data={data}
      />
    </div>
  );
};

export default ResultsTable;
