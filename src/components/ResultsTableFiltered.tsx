import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALL_TEXT_MODELS } from "@/data";
import { useFormState } from "@/hooks/useFormState";
import { computePrices, computeTokens } from "@/lib/computations";
import { AppData } from "@/types/appData";
import { Provider } from "@/types/model";
import { PricingResult } from "@/types/results";
import { chain, entries } from "lodash";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import ColumnVisibilitySettings from "./table/ColumnVisibilitySettings";
import FilterControls from "./table/FilterControls";
import ResultsTableRow from "./table/ResultsTableRow";
import TagFilter from "./table/TagFilter";
import TierFilter from "./table/TierFilter";

interface ResultsTableFilteredProps {
  data: AppData;
}

type SortOrder = "asc" | "desc";

const ResultsTableFiltered = ({ data }: ResultsTableFilteredProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showColumns, setShowColumns] = useFormState("showColumns");
  const [selectedTiers, setSelectedTiers] = useFormState("selectedTiers");
  const [tags, setTags] = useFormState("modelCapabilities");

  const pricingResults = useMemo(
    () =>
      chain(ALL_TEXT_MODELS)
        .filter(
          (model) =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedProvider === "all" ||
              model.provider === selectedProvider) &&
            (selectedTiers.length === 0 ||
              selectedTiers.includes(model.tier)) &&
            (tags.length === 0 || model.tags?.some((tag) => tags.includes(tag)))
        )
        .map((model) => ({ model, ...computeTokens(data, model) }))
        .map((result) => ({
          ...result,
          ...computePrices(data, result.model, result),
        }))
        .value(),
    [data, searchTerm, selectedProvider, selectedTiers, tags]
  );

  const { filteredResults } = useMemo(() => {
    if (!pricingResults)
      return { filteredResults: {} as Record<Provider, PricingResult[]> };

    const filteredResults = chain(pricingResults)
      .filter(
        (result) =>
          selectedProvider === "all" ||
          result.model.provider === selectedProvider
      )
      .sortBy((result) => result.totalCost)
      .thru((results) => (sortOrder === "desc" ? results.reverse() : results))
      .groupBy((result) => result.model.provider)
      .value();

    return {
      filteredResults: filteredResults as Record<Provider, PricingResult[]>,
    };
  }, [pricingResults, selectedProvider, sortOrder]);

  if (!pricingResults) return null;

  const toggleSort = () => {
    setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
  };

  const renderTierDots = (tier: string) => {
    const dots = tier === "small" ? 1 : tier === "medium" ? 2 : 3;
    return (
      <div className="flex gap-1">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < dots ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
        />

        <ColumnVisibilitySettings
          showColumns={showColumns}
          setShowColumns={setShowColumns}
        />
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Provider</TableHead>
              <TableHead className="font-semibold">Model</TableHead>
              {showColumns.size && (
                <TableHead className="font-semibold">Size</TableHead>
              )}
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  Tier
                  <TierFilter
                    selectedTiers={selectedTiers}
                    setSelectedTiers={setSelectedTiers}
                  />
                </div>
              </TableHead>
              {showColumns.tags && (
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-2">
                    Tags
                    <TagFilter tags={tags} setTags={setTags} />
                  </div>
                </TableHead>
              )}
              {showColumns.inputOutput && (
                <>
                  <TableHead className="font-semibold text-right">
                    Input Cost
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Output Cost
                  </TableHead>
                </>
              )}
              {showColumns.cachedTokens && (
                <TableHead className="font-semibold text-right">
                  Cached Tokens
                </TableHead>
              )}
              <TableHead className="font-semibold text-right">
                <Button
                  variant="ghost"
                  onClick={toggleSort}
                  className="p-0 h-auto"
                >
                  Total Cost
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries(filteredResults).map(([provider, results]) =>
              results.map((result, index) => {
                const isCheapestInProvider = index === 0;
                return (
                  <ResultsTableRow
                    key={`${provider}-${result.model.name}`}
                    result={result}
                    isBest={false}
                    isCheapestInProvider={isCheapestInProvider}
                    showColumns={showColumns}
                    renderTierDots={renderTierDots}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsTableFiltered;
