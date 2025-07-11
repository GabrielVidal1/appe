import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showSize, setShowSize] = useState(false);
  const [showInputOutput, setShowInputOutput] = useState(false);

  const pricingResults = useMemo(() => {
    if (!data) return null;

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

    const groupedResults = groupModelsByProvider(results);
    const bestValue = findBestValue(results);

    return { results, groupedResults, bestValue, tokenEstimates };
  }, [data]);

  const filteredAndGroupedResults = useMemo(() => {
    if (!pricingResults) return {};

    const filtered = pricingResults.results.filter((result) =>
      result.model.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped: { [provider: string]: typeof filtered } = {};
    filtered.forEach((result) => {
      if (!grouped[result.model.provider]) {
        grouped[result.model.provider] = [];
      }
      grouped[result.model.provider].push(result);
    });

    // Sort each provider group by price ascending and sort providers by their cheapest model
    Object.keys(grouped).forEach((provider) => {
      grouped[provider].sort((a, b) => a.totalCost - b.totalCost);
    });

    const sortedProviders = Object.keys(grouped).sort((a, b) => {
      const cheapestA = grouped[a][0]?.totalCost || Infinity;
      const cheapestB = grouped[b][0]?.totalCost || Infinity;
      return cheapestA - cheapestB;
    });

    const sortedGrouped: { [provider: string]: typeof filtered } = {};
    sortedProviders.forEach((provider) => {
      sortedGrouped[provider] = grouped[provider];
    });

    return sortedGrouped;
  }, [pricingResults, searchTerm]);

  if (!data || !pricingResults) return null;

  const { bestValue, tokenEstimates } = pricingResults;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            AI Model Cost Comparison
          </CardTitle>
          <div className="text-center text-gray-600">
            <p>
              Processing {data.dataCount.toLocaleString()} {data.dataType} items
            </p>
            {data.imageSize && (
              <p className="text-sm">
                Image size: {data.imageSize.width}×{data.imageSize.height}
              </p>
            )}
            <p className="text-sm">
              Estimated ~{tokenEstimates.input} input + ~{tokenEstimates.output}{" "}
              output tokens per item
            </p>
            <Badge variant="secondary" className="mt-2">
              Best Value: {bestValue.model.model} ($
              {bestValue.totalCost.toFixed(2)})
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Column Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-6">
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
          </div>

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
                    Total Cost
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(filteredAndGroupedResults).map(
                  ([provider, results]) =>
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
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700">Data Type:</h4>
              <p className="text-gray-600 capitalize">{data.dataType}</p>
            </div>
            {data.imageSize && (
              <div>
                <h4 className="font-semibold text-gray-700">Image Size:</h4>
                <p className="text-gray-600">
                  {data.imageSize.width}×{data.imageSize.height}
                </p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-700">
                Processing Prompt:
              </h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {data.prompt}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Example Output:</h4>
              <ul className="space-y-2">
                <li className="text-gray-600 bg-gray-50 p-2 rounded">
                  {data.example}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(filteredAndGroupedResults).map(([provider, providerModels]) => {
                const cheapestInProvider = providerModels[0];

                return (
                  <div key={provider} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{provider}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {providerModels.length} models available
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Best option:</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {cheapestInProvider.model.model}
                        </div>
                        <div className="text-green-600 font-semibold">
                          ${cheapestInProvider.totalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsTable;
