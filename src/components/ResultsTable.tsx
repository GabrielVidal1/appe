import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ALL_TEXT_MODELS } from "@/data";
import { AppData } from "@/types/appData";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import ResultsSummary from "./ResultsSummary";
import ResultsTableFiltered from "./ResultsTableFiltered";

interface ResultsTableProps {
  data: AppData | null;
  configFromUrl?: AppData | null;
  className?: string;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  data: propData,
  configFromUrl,
  className,
}) => {
  const { watch, subscribe, getValues, setValue } = useFormContext<AppData>();
  const [data, setData] = useState<AppData | null>(configFromUrl || propData);
  const selectedTiers: AppData["selectedTiers"] = watch("selectedTiers");
  const modelCapabilities: string[] = watch("modelCapabilities");
  const batchEnabled: boolean = watch("batchEnabled") ?? false;

  useEffect(() => {
    subscribe({
      formState: { isDirty: true },
      callback: () => {
        setData(getValues());
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  const models = ALL_TEXT_MODELS.filter((model) => {
    return (
      (selectedTiers.length === 0 || selectedTiers.includes(model.tier)) &&
      model.tags.some((tag) =>
        modelCapabilities.length ? modelCapabilities.includes(tag) : true
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
              <Label htmlFor="batch-toggle" className="text-sm font-medium">
                Batch Pricing
              </Label>
              <Switch
                id="batch-toggle"
                checked={batchEnabled}
                onCheckedChange={handleBatchToggle}
              />
            </div>
            <div className="flex-1 mx-12">
              <ResultsSummary data={data} models={models} />
            </div>
          </div>
          <ResultsTableFiltered data={{ ...data, batchEnabled }} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsTable;
