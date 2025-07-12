
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { getProviderIcon } from "../ProviderIcons";

interface ResultsTableRowProps {
  result: any;
  isBest: boolean;
  isCheapestInProvider: boolean;
  showColumns: Record<string, boolean>;
  renderTierDots: (tier: string) => JSX.Element;
}

const ResultsTableRow = ({
  result,
  isBest,
  isCheapestInProvider,
  showColumns,
  renderTierDots,
}: ResultsTableRowProps) => {
  return (
    <TableRow
      className={
        isBest
          ? "bg-green-50 border-green-200"
          : isCheapestInProvider
          ? "bg-blue-50"
          : ""
      }
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {getProviderIcon(result.model.provider)}
          {result.model.provider}
        </div>
      </TableCell>
      <TableCell>{result.model.model}</TableCell>
      {showColumns.size && (
        <TableCell className="text-nowrap">
          {result.model.model_size
            ? `${result.model.model_size}B`
            : "N/A"}
        </TableCell>
      )}
      <TableCell>{renderTierDots(result.model.tier)}</TableCell>
      {showColumns.tags && (
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {result.model.tags?.map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs"
              >
                {tag}
              </Badge>
            )) || "—"}
          </div>
        </TableCell>
      )}
      {showColumns.inputOutput && (
        <>
          <TableCell className="text-right">
            ${result.inputCost.toFixed(2)}
          </TableCell>
          <TableCell className="text-right">
            ${result.outputCost.toFixed(2)}
          </TableCell>
        </>
      )}
      <TableCell className="text-right font-semibold">
        ${result.totalCost.toFixed(2)}
      </TableCell>
    </TableRow>
  );
};

export default ResultsTableRow;
