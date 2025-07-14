import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALL_TEXT_MODELS } from "@/data";
import { useAppData } from "@/hooks/useAppData";
import { useFormState } from "@/hooks/useFormState";
import { computePrices, computeTokens } from "@/lib/computations";
import { chain, first, flatMap } from "lodash";
import { ArrowUpDown, Download } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import ColumnVisibilitySettings from "./table/ColumnVisibilitySettings";
import FilterControls from "./table/FilterControls";
import ResultsTableRow from "./table/ResultsTableRow";
import TagFilter from "./table/TagFilter";
import TierFilter from "./table/TierFilter";
import { Checkbox } from "./ui/checkbox";

interface ResultsTableFilteredProps {
  onExport?: () => void;
}

type SortOrder = "asc" | "desc";

const ResultsTableFiltered: React.FC<ResultsTableFilteredProps> = ({
  onExport,
}) => {
  const { appData: data, watch } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showColumns, setShowColumns] = useFormState("showColumns");
  const [selectedTiers, setSelectedTiers] = useFormState("selectedTiers");
  const [tags, setTags] = useFormState("modelCapabilities");
  const [selectedModels, setSelectedModels] = useFormState("selectedModels");

  const batchEnabled = watch("batchEnabled");

  const pricingResults = useMemo(
    () =>
      chain(ALL_TEXT_MODELS)
        .tap(() => {
          console.log("Computing pricingResults");
        })
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
          ...computePrices({ ...data, batchEnabled }, result.model, result),
        }))
        .value(),

    [
      searchTerm,
      selectedProvider,
      selectedTiers,
      tags,
      batchEnabled,
      data.prompt,
      data.example,
      data.dataType,
      data.dataCount,
    ]
  );

  const { filteredResults } = useMemo(() => {
    // console.log("Recomputing filtered results", {
    //   pricingResults,
    //   selectedProvider,
    //   sortOrder,
    // });
    if (!pricingResults) return { filteredResults: [] };

    const filteredResults = chain(pricingResults)
      .filter(
        (result) =>
          selectedProvider === "all" ||
          result.model.provider === selectedProvider
      )
      .sortBy((result) => result.totalCost)
      .thru((results) => (sortOrder === "desc" ? results.reverse() : results))
      // .groupBy((result) => result.model.provider)
      .value();

    return {
      filteredResults,
    };
  }, [pricingResults, selectedProvider, sortOrder]);

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

  useEffect(() => {
    setSelectedModels((prev) =>
      chain(filteredResults)
        // .tap(() => {
        //   console.log("Updating selected models based on filtered results");
        // })
        .groupBy((result) => result.model.provider)
        .mapValues((results) => first(results)?.model.id)
        .values()
        .value()
        .concat(
          prev.filter(
            (id) => !flatMap(filteredResults).some((r) => r.model.id === id)
          )
        )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModels.length, filteredResults]);

  if (!pricingResults) return null;

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

        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => onExport?.()}
        >
          Export Results
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">
                <Checkbox
                  checked={
                    selectedModels.length < pricingResults.length
                      ? "indeterminate"
                      : selectedModels.length === pricingResults.length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedModels(
                        pricingResults.map((result) => result.model.id)
                      );
                    } else {
                      setSelectedModels([]);
                    }
                  }}
                  className="h-4 w-4"
                />
              </TableHead>

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
            {chain(filteredResults)
              .groupBy((result) => result.model.provider)
              .entries()
              .map(([provider, results]) =>
                results.map((result) => {
                  return (
                    <ResultsTableRow
                      selectable
                      selected={selectedModels.includes(result.model.id)}
                      onSelect={(selected) => {
                        setSelectedModels((prev) =>
                          !selected
                            ? prev.filter((m) => m !== result.model.id)
                            : [...prev, result.model.id]
                        );
                      }}
                      key={`${provider}-${result.model.name}`}
                      result={result}
                      showColumns={showColumns}
                      renderTierDots={renderTierDots}
                    />
                  );
                })
              )
              .value()}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsTableFiltered;
