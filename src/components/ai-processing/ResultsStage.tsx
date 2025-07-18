import { useState } from "react";
import { Download, FileText, Archive, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ResultsStageProps {
  results?: any[];
  email?: string;
  className?: string;
}

const ResultsStage: React.FC<ResultsStageProps> = ({ 
  results = [], 
  email, 
  className 
}) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'zip'>('json');
  const { toast } = useToast();

  const handleExport = (format: 'json' | 'csv' | 'zip') => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(results, null, 2);
          filename = 'ai-processing-results.json';
          mimeType = 'application/json';
          break;
        
        case 'csv':
          if (results.length === 0) {
            throw new Error('No results to export');
          }
          
          const headers = Object.keys(results[0]);
          const csvContent = [
            headers.join(','),
            ...results.map(row => 
              headers.map(header => {
                const value = row[header];
                // Escape CSV values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              }).join(',')
            )
          ].join('\n');
          
          content = csvContent;
          filename = 'ai-processing-results.csv';
          mimeType = 'text/csv';
          break;
        
        case 'zip':
          // For ZIP, we'll create a JSON file and inform user about ZIP limitation
          content = JSON.stringify(results, null, 2);
          filename = 'ai-processing-results.json';
          mimeType = 'application/json';
          
          toast({
            title: "ZIP Export",
            description: "ZIP export will download as JSON for now. Full ZIP support coming soon.",
          });
          break;
        
        default:
          throw new Error('Unsupported export format');
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Results exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export results",
        variant: "destructive",
      });
    }
  };

  const successfulResults = results.filter(r => r.status === 'completed');
  const failedResults = results.filter(r => r.status === 'failed');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Success Banner */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Processing Complete!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                Results have been sent to {email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{successfulResults.length}</div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{failedResults.length}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{results.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Results
          </CardTitle>
          <CardDescription>
            Download your processing results in different formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => handleExport('json')}
            >
              <FileText className="w-6 h-6" />
              <span>Export as JSON</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => handleExport('csv')}
            >
              <FileText className="w-6 h-6" />
              <span>Export as CSV</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => handleExport('zip')}
            >
              <Archive className="w-6 h-6" />
              <span>Export as ZIP</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Results Preview</CardTitle>
          <CardDescription>
            Preview of your processed data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({results.length})</TabsTrigger>
              <TabsTrigger value="successful">Successful ({successfulResults.length})</TabsTrigger>
              {failedResults.length > 0 && (
                <TabsTrigger value="failed">Failed ({failedResults.length})</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <ResultsList results={results} />
            </TabsContent>
            
            <TabsContent value="successful" className="space-y-4">
              <ResultsList results={successfulResults} />
            </TabsContent>
            
            <TabsContent value="failed" className="space-y-4">
              <ResultsList results={failedResults} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface ResultsListProps {
  results: any[];
}

const ResultsList: React.FC<ResultsListProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No results to display
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-auto">
      {results.slice(0, 10).map((result, index) => (
        <div key={result.id || index} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">#{result.id}</span>
              <Badge variant={result.status === 'completed' ? 'default' : 'destructive'}>
                {result.status}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(result.timestamp).toLocaleString()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <div className="text-muted-foreground">Input:</div>
              <div className="bg-muted p-2 rounded text-xs">
                {JSON.stringify(result.input).substring(0, 100)}...
              </div>
            </div>
            
            <div>
              <div className="text-muted-foreground">Output:</div>
              <div className="bg-muted p-2 rounded text-xs">
                {result.output?.substring(0, 100)}...
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {results.length > 10 && (
        <div className="text-center text-muted-foreground text-sm">
          ... and {results.length - 10} more results
        </div>
      )}
    </div>
  );
};

export { ResultsStage };