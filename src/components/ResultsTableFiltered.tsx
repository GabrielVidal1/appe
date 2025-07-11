
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculatePricing,
  estimateTokens,
  findBestValue,
  groupModelsByProvider,
} from "@/lib/computations";
import { ArrowUpDown, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";

interface ResultsTableFilteredProps {
  data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    example: string;
    imageSize?: { width: number; height: number };
  };
}

type SortOrder = "asc" | "desc";

const ResultsTableFiltered = ({ data }: ResultsTableFilteredProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSize, setShowSize] = useState(false);
  const [showInputOutput, setShowInputOutput] = useState(false);

  const pricingResults = useMemo(() => {
    const tokenEstimates = estimateTokens(
      data.dataType,
      data.prompt,
      data.example,
      data.imageSize
    );
    const results = calculatePricing({
      dataCount: data.dataCount,
      inputTokensPerItem: tokenEstimates.input,
      outputTokensPerItem: tokenEstimates.output,
    });

    const bestValue = findBestValue(results);
    return { results, bestValue };
  }, [data]);

  const { filteredResults, providers } = useMemo(() => {
    if (!pricingResults) return { filteredResults: [], providers: [] };

    let filtered = pricingResults.results.filter((result) => {
      const matchesSearch = result.model.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = selectedProvider === "all" || result.model.provider === selectedProvider;
      return matchesSearch && matchesProvider;
    });

    // Sort by cost
    filtered.sort((a, b) => {
      return sortOrder === "asc" ? a.totalCost - b.totalCost : b.totalCost - a.totalCost;
    });

    // Group by provider
    const grouped: { [provider: string]: typeof filtered } = {};
    filtered.forEach((result) => {
      if (!grouped[result.model.provider]) {
        grouped[result.model.provider] = [];
      }
      grouped[result.model.provider].push(result);
    });

    // Get unique providers for filter dropdown
    const uniqueProviders = Array.from(new Set(pricingResults.results.map(r => r.model.provider)));

    return { filteredResults: grouped, providers: uniqueProviders };
  }, [pricingResults, searchTerm, selectedProvider, sortOrder]);

  if (!pricingResults) return null;

  const { bestValue } = pricingResults;

  const toggleSort = () => {
    setSortOrder(current => current === "asc" ? "desc" : "asc");
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
            {providers.map((provider) => (
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
                  checked={showSize}
                  onCheckedChange={setShowSize}
                />
                <Label htmlFor="show-size" className="text-sm">
                  Show Size
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-input-output"
                  checked={showInputOutput}
                  onCheckedChange={setShowInputOutput}
                />
                <Label htmlFor="show-input-output" className="text-sm">
                  Show Input/Output
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
              {showSize && (
                <TableHead className="font-semibold">Size</TableHead>
              )}
              {showInputOutput && (
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
                <Button variant="ghost" onClick={toggleSort} className="p-0 h-auto">
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
                      {provider}
                      {isCheapestInProvider && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Cheapest
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.model.model}
                      {isBest && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Best Value
                        </Badge>
                      )}
                    </TableCell>
                    {showSize && (
                      <TableCell>
                        {result.model.model_size
                          ? `${result.model.model_size}B`
                          : "N/A"}
                      </TableCell>
                    )}
                    {showInputOutput && (
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
