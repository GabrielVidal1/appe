import { useState, useCallback } from "react";
import { Upload, FileText, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ImportDataStageProps {
  onComplete: (data: any[]) => void;
  className?: string;
}

const ImportDataStage: React.FC<ImportDataStageProps> = ({ onComplete, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [importedData, setImportedData] = useState<any[] | null>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processCSVFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim());
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const processZipFile = async (file: File): Promise<any[]> => {
    // For now, return mock data - in real implementation, you'd use a zip library
    toast({
      title: "ZIP Processing",
      description: "ZIP file processing is not fully implemented yet. Using mock data.",
    });
    
    return [
      { id: 1, content: "Sample data from ZIP", type: "text" },
      { id: 2, content: "Another sample entry", type: "text" },
    ];
  };

  const handleFileProcessing = async (files: FileList) => {
    try {
      const file = files[0];
      let data: any[] = [];

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        data = await processCSVFile(file);
      } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        data = await processZipFile(file);
      } else {
        throw new Error('Unsupported file type. Please upload CSV or ZIP files.');
      }

      setImportedData(data);
      toast({
        title: "Success",
        description: `Imported ${data.length} records from ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileProcessing(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcessing(e.target.files);
    }
  };

  const handleContinue = () => {
    if (importedData) {
      onComplete(importedData);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Your Data
          </CardTitle>
          <CardDescription>
            Upload a CSV file or ZIP folder containing your data to process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border",
              "hover:border-primary/50 hover:bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <FileText className="w-12 h-12 text-muted-foreground" />
                <Archive className="w-12 h-12 text-muted-foreground" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium">
                  {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                </h3>
                <p className="text-muted-foreground mt-1">
                  Supports CSV and ZIP files
                </p>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.zip"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  Choose File
                </Button>
              </div>
            </div>
          </div>

          {importedData && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Successfully imported {importedData.length} records
              </p>
              
              <div className="max-h-32 overflow-auto text-xs bg-background p-2 rounded border">
                <pre>{JSON.stringify(importedData.slice(0, 3), null, 2)}</pre>
                {importedData.length > 3 && (
                  <p className="text-muted-foreground mt-2">
                    ... and {importedData.length - 3} more records
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {importedData && (
        <div className="flex justify-end">
          <Button onClick={handleContinue}>
            Continue to Templates
          </Button>
        </div>
      )}
    </div>
  );
};

export { ImportDataStage };