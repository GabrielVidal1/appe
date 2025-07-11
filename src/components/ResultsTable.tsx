import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDataContext } from "@/contexts/form/type";
import { ALL_MODELS } from "@/lib/computations";
import { useFormContext } from "react-hook-form";
import ResultsSummary from "./ResultsSummary";
import ResultsTableFiltered from "./ResultsTableFiltered";

interface ResultsTableProps {
  data: FormDataContext | null;
}

const ResultsTable = ({ data }: ResultsTableProps) => {
  const { watch } = useFormContext();
  const selectedTiers: FormDataContext["selectedTiers"] =
    watch("selectedTiers");
  const modelCapabilities: string[] = watch("modelCapabilities");

  if (!data) return null;

  const models = ALL_MODELS.filter((model) => {
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
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {/* AI Model Cost Comparison */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResultsSummary data={data} models={models} />
          <ResultsTableFiltered data={data} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsTable;
