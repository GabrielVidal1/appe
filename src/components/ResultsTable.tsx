import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResultsSummary from "./ResultsSummary";
import ResultsTableFiltered from "./ResultsTableFiltered";

interface ResultsTableProps {
  data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    example: string;
    imageSize?: { width: number; height: number };
  } | null;
}

const ResultsTable = ({ data }: ResultsTableProps) => {
  if (!data) return null;

  return (
    <div className="w-full mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            AI Model Cost Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResultsSummary data={data} />
          <ResultsTableFiltered data={data} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsTable;
