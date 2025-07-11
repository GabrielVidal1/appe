
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculatePricing, estimateTokens, groupModelsByProvider, findBestValue, type PricingResult } from "@/lib/computations";
import { useMemo } from "react";

interface ResultsTableProps {
  data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    examples: string[];
  } | null;
}

const ResultsTable = ({ data }: ResultsTableProps) => {
  const pricingResults = useMemo(() => {
    if (!data) return null;

    const tokenEstimates = estimateTokens(data.dataType, data.prompt, data.examples);
    const results = calculatePricing({
      dataCount: data.dataCount,
      inputTokensPerItem: tokenEstimates.input,
      outputTokensPerItem: tokenEstimates.output
    });

    const groupedResults = groupModelsByProvider(results);
    const bestValue = findBestValue(results);

    return { results, groupedResults, bestValue, tokenEstimates };
  }, [data]);

  if (!data || !pricingResults) return null;

  const { results, groupedResults, bestValue, tokenEstimates } = pricingResults;
  const providers = Object.keys(groupedResults);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">AI Model Cost Comparison</CardTitle>
          <div className="text-center text-gray-600">
            <p>Processing {data.dataCount.toLocaleString()} {data.dataType} items</p>
            <p className="text-sm">Estimated ~{tokenEstimates.input} input + ~{tokenEstimates.output} output tokens per item</p>
            <Badge variant="secondary" className="mt-2">
              Best Value: {bestValue.model.model} (${bestValue.totalCost.toFixed(2)})
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Model</TableHead>
                  <TableHead className="font-semibold">Provider</TableHead>
                  <TableHead className="font-semibold">Size</TableHead>
                  <TableHead className="font-semibold text-right">Input Cost</TableHead>
                  <TableHead className="font-semibold text-right">Output Cost</TableHead>
                  <TableHead className="font-semibold text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results
                  .sort((a, b) => a.totalCost - b.totalCost)
                  .map((result, index) => {
                    const isBest = result.model.model === bestValue.model.model;
                    return (
                      <TableRow key={index} className={isBest ? "bg-green-50" : ""}>
                        <TableCell className="font-medium">
                          {result.model.model}
                          {isBest && <Badge variant="secondary" className="ml-2 text-xs">Best Value</Badge>}
                        </TableCell>
                        <TableCell>{result.model.provider}</TableCell>
                        <TableCell>
                          {result.model.model_size ? `${result.model.model_size}B` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">${result.inputCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${result.outputCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${result.totalCost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
            <div>
              <h4 className="font-semibold text-gray-700">Processing Prompt:</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{data.prompt}</p>
            </div>
            {data.examples.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700">Example Outputs:</h4>
                <ul className="space-y-2">
                  {data.examples.map((example, index) => (
                    <li key={index} className="text-gray-600 bg-gray-50 p-2 rounded">
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.map(provider => {
                const providerModels = groupedResults[provider];
                const cheapestInProvider = providerModels.reduce((min, current) => 
                  current.totalCost < min.totalCost ? current : min
                );
                
                return (
                  <div key={provider} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{provider}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {providerModels.length} models available
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Best option:</span>
                      <div className="text-right">
                        <div className="font-medium">{cheapestInProvider.model.model}</div>
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
