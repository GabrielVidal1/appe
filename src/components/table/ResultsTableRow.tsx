import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { PricingResult } from "@/types/results";
import { getProviderIcon } from "../ProviderIcons";
import { Checkbox } from "../ui/checkbox";

interface ResultsTableRowProps {
  result: PricingResult;
  selectable?: boolean;
  selected?: boolean;
  showColumns: Record<string, boolean>;
  renderTierDots: (tier: string) => JSX.Element;
  onSelect?: (checked: boolean) => void;
  batchEnabled?: boolean;
}

const ResultsTableRow = ({
  selectable,
  selected,
  result,
  showColumns,
  renderTierDots,
  onSelect,
}: ResultsTableRowProps) => {
  return (
    <TableRow
      className={
        // isBest
        //   ? "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700"
        selected ? "bg-blue-50 dark:bg-blue-900" : ""
      }
    >
      {selectable && (
        <TableCell className="font-medium">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(!!checked)}
            className="h-4 w-4"
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {getProviderIcon(result.model.provider)}
          {result.model.provider}
        </div>
      </TableCell>
      <TableCell>{result.model.name}</TableCell>
      {showColumns.size && (
        <TableCell className="text-nowrap">
          {result.model.model_size ? `${result.model.model_size}B` : "N/A"}
        </TableCell>
      )}
      <TableCell>{renderTierDots(result.model.tier)}</TableCell>
      {showColumns.tags && (
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {result.model.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            )) || "—"}
          </div>
        </TableCell>
      )}
      {showColumns.inputOutput && (
        <>
          <TableCell className="text-right">
            ${result.inputCost.total.toFixed(2)}
          </TableCell>
          <TableCell className="text-right">
            ${result.outputCost.toFixed(2)}
          </TableCell>
        </>
      )}
      {showColumns.cachedTokens && (
        <TableCell className="text-right">
          {result.model.cache_cost
            ? `${(result.model.cache_cost * 100).toFixed(0)} %`
            : "—"}
        </TableCell>
      )}
      <TableCell className="text-right font-semibold">
        ${result.totalCost.toFixed(2)}
      </TableCell>
    </TableRow>
  );
};

export default ResultsTableRow;
