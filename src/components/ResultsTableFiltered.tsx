import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
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
import { ALL_PROVIDERS, ALL_TAGS, ALL_TIERS } from "@/lib/constants";
import { ArrowUpDown, Filter, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { getProviderIcon } from "./ProviderIcons";

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
  }, [data]);

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

  const handleTierChange = (
    tier: FormDataContext["modelSize"],
    checked: boolean
  ) => {
    setSelectedTiers((prev) =>
      checked ? [...prev, tier] : prev.filter((t) => t !== tier)
    );
  };

  const handleTagToggle = (tag: string, exclude: boolean) => {
    setTags((prev) => {
      const tags = prev ?? [];
      return exclude ? [...tags, tag] : tags.filter((t) => t !== tag);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {ALL_PROVIDERS.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-4">
              <h4 className="font-medium">Column Visibility</h4>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-size"
                  checked={showColumns.size}
                  onCheckedChange={(value) =>
                    setShowColumns((prev) => ({ ...prev, size: value }))
                  }
                />
                <Label htmlFor="show-size" className="text-sm">
                  Size
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-input-output"
                  checked={showColumns.inputOutput}
                  onCheckedChange={(value) =>
                    setShowColumns((prev) => ({ ...prev, inputOutput: value }))
                  }
                />
                <Label htmlFor="show-input-output" className="text-sm">
                  Input/Output prices
                </Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Filter className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Filter by Tier</h4>
                        {ALL_TIERS.map((tier) => (
                          <div
                            key={tier}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`tier-${tier}`}
                              checked={selectedTiers.includes(tier)}
                              onCheckedChange={(checked) =>
                                handleTierChange(tier, !!checked)
                              }
                            />
                            <Label
                              htmlFor={`tier-${tier}`}
                              className="text-sm capitalize"
                            >
                              {tier}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  Tags
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Filter className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-3">
                        {ALL_TAGS.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`tag-${tag}`}
                              checked={tags === null || tags?.includes(tag)}
                              onCheckedChange={(checked) =>
                                handleTagToggle(tag, !!checked)
                              }
                            />
                            <Label htmlFor={`tag-${tag}`} className="text-sm">
                              {tag}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
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
                  <TableRow
                    key={`${provider}-${result.model.model}`}
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
                        {getProviderIcon(provider)}
                        {provider}
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
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {result.model.tag?.map((tag) => (
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsTableFiltered;
