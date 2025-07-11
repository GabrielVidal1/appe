
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResultsTableProps {
  data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    examples: string[];
  } | null;
}

const ResultsTable = ({ data }: ResultsTableProps) => {
  if (!data) return null;

  // Placeholder pricing data - you mentioned you'll provide the algorithm later
  const providers = ["OpenAI", "Anthropic", "Mistral"];
  const modelSizes = ["Small", "Medium", "Large"];

  // Mock pricing calculation (replace with your algorithm)
  const calculatePrice = (provider: string, size: string) => {
    const baseRates = {
      "OpenAI": { "Small": 0.001, "Medium": 0.003, "Large": 0.006 },
      "Anthropic": { "Small": 0.0008, "Medium": 0.0025, "Large": 0.005 },
      "Mistral": { "Small": 0.0006, "Medium": 0.002, "Large": 0.004 }
    };
    
    const rate = baseRates[provider as keyof typeof baseRates][size as keyof typeof baseRates.OpenAI];
    return (rate * data.dataCount).toFixed(2);
  };

  const getBestValue = () => {
    let minPrice = Infinity;
    let bestOption = "";
    
    providers.forEach(provider => {
      modelSizes.forEach(size => {
        const price = parseFloat(calculatePrice(provider, size));
        if (price < minPrice) {
          minPrice = price;
          bestOption = `${provider} ${size}`;
        }
      });
    });
    
    return bestOption;
  };

  const bestValue = getBestValue();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Cost Comparison Results</CardTitle>
          <div className="text-center text-gray-600">
            <p>Processing {data.dataCount.toLocaleString()} {data.dataType} items</p>
            <Badge variant="secondary" className="mt-2">Best Value: {bestValue}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-700">Model Size</th>
                  {providers.map(provider => (
                    <th key={provider} className="text-center p-4 font-semibold text-gray-700">
                      {provider}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modelSizes.map(size => (
                  <tr key={size} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{size}</td>
                    {providers.map(provider => {
                      const price = calculatePrice(provider, size);
                      const isBest = `${provider} ${size}` === bestValue;
                      return (
                        <td key={provider} className="p-4 text-center">
                          <div className={`inline-block px-3 py-2 rounded-lg ${
                            isBest 
                              ? 'bg-green-100 text-green-800 font-semibold border-2 border-green-300' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            ${price}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};

export default ResultsTable;
