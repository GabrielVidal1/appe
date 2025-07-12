import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDataContext } from "@/contexts/form/type";
import { useFormState } from "@/hooks/useFormState";
import {
  ALL_MODELS,
  calculatePricing,
  estimateTokens,
  findBestValue,
} from "@/lib/computations";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import ColumnVisibilitySettings from "./table/ColumnVisibilitySettings";
import FilterControls from "./table/FilterControls";
import ResultsTableRow from "./table/ResultsTableRow";
import TagFilter from "./table/TagFilter";
import TierFilter from "./table/TierFilter";

interface ResultsTableFilteredProps {
  data: FormDataContext;
}

type SortOrder = "asc" | "desc";

const ResultsTableFiltered = ({ data }: ResultsTableFilteredProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showColumns, setShowColumns] = useFormState("showColumns");
  const [selectedTiers, setSelectedTiers] = useFormState("selectedTiers");
  const [tags, setTags] = useFormState("modelCapabilities");

  const pricingResults = useMemo(() => {
    const tokenEstimates = estimateTokens(
      data.dataType,
      data.prompt,
      data.example,
      data.imageSize
    );

    const models = ALL_MODELS.filter((model) => {
      return (
        model.model.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedProvider === "all" || model.provider === selectedProvider) &&
        (selectedTiers.length === 0 || selectedTiers.includes(model.tier)) &&
        (tags.length === 0 || model.tags?.some((tag) => tags.includes(tag)))
      );
    });

    const results = calculatePricing(models, {
      dataCount: data.dataCount,
      inputTokensPerItem: tokenEstimates.input,
      outputTokensPerItem: tokenEstimates.output,
    });

    const bestValue = findBestValue(results);
    return { results, bestValue };
  }, [data, searchTerm, selectedProvider, selectedTiers, tags]);

  const { filteredResults } = useMemo(() => {
    if (!pricingResults) return { filteredResults: [] };

    const filtered = pricingResults.results.filter((result) => {
      const matchesSearch = result.model.model
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesProvider =
        selectedProvider === "all" ||
        result.model.provider === selectedProvider;
      const matchesTier = selectedTiers.includes(result.model.tier);
      const matchesTags = result.model.tags?.some((tag) =>
        tags.length ? tags.includes(tag) : true
      );

      return matchesSearch && matchesProvider && matchesTier && matchesTags;
    });

    // Sort by cost
    filtered.sort((a, b) => {
      return sortOrder === "asc"
        ? a.totalCost - b.totalCost
        : b.totalCost - a.totalCost;
    });

    // Group by provider
    const grouped: { [provider: string]: typeof filtered } = {};
    filtered.forEach((result) => {
      if (!grouped[result.model.provider]) {
        grouped[result.model.provider] = [];
      }
      grouped[result.model.provider].push(result);
    });

    return {
      filteredResults: grouped,
    };
  }, [
    pricingResults,
    searchTerm,
    selectedProvider,
    sortOrder,
    selectedTiers,
    tags,
  ]);

  if (!pricingResults) return null;

  const { bestValue } = pricingResults;

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
            {Object.entries(filteredResults).map(([provider, results]) =>
              results.map((result, index) => {
                const isBest = result.model.model === bestValue.model.model;
                const isCheapestInProvider = index === 0;
                return (
                  <ResultsTableRow
                    key={`${provider}-${result.model.model}`}
                    result={result}
                    isBest={isBest}
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
