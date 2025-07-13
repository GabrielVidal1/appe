import { Card, CardContent } from "@/components/ui/card";
import { ALL_TEXT_MODELS } from "@/data";
import { AppData } from "@/types/appData";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import ResultsSummary from "./ResultsSummary";
import ResultsTableFiltered from "./ResultsTableFiltered";

interface ResultsTableProps {
  data: AppData | null;
  configFromUrl?: AppData | null;
}

const ResultsTable = ({ data: propData, configFromUrl }: ResultsTableProps) => {
  const { watch, subscribe, getValues } = useFormContext<AppData>();
  const [data, setData] = useState<AppData | null>(configFromUrl || propData);
  const selectedTiers: AppData["selectedTiers"] = watch("selectedTiers");
  const modelCapabilities: string[] = watch("modelCapabilities");

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

  return (
    <div className="w-full mx-auto space-y-6">
      <Card>
        <CardContent className="space-y-6 mt-6">
          <ResultsSummary data={data} models={models} />
          <ResultsTableFiltered data={data} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsTable;
