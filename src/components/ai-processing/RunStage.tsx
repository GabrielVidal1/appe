import { useState } from "react";
import { Play, Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface RunStageProps {
  importedData?: any[];
  templates?: any;
  onComplete: (data: { email: string; results: any[] }) => void;
  className?: string;
}

const RunStage: React.FC<RunStageProps> = ({ 
  importedData, 
  templates, 
  onComplete, 
  className 
}) => {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const { toast } = useToast();

  const totalRecords = importedData?.length || 0;
  const selectedTemplate = templates?.templates?.find((t: any) => t.id === templates.selectedTemplate);

  const simulateProcessing = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email to receive results",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);

    // Simulate processing with progress updates
    const results: any[] = [];
    
    for (let i = 0; i < totalRecords; i++) {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const record = importedData![i];
      const processedResult = {
        id: i + 1,
        input: record,
        output: `Processed result for ${JSON.stringify(record).substring(0, 50)}...`,
        template: selectedTemplate?.name || 'Default',
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      results.push(processedResult);
      setProcessedCount(i + 1);
      setProgress(((i + 1) / totalRecords) * 100);
    }

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: "Processing Complete",
      description: `Results will be sent to ${email}`,
    });

    setIsProcessing(false);
    onComplete({ email, results });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Run AI Processing
          </CardTitle>
          <CardDescription>
            Start processing your data with the configured templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Processing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{totalRecords}</div>
              <div className="text-sm text-muted-foreground">Records to Process</div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{templates?.templates?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Templates Configured</div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{templates?.examples?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Examples Provided</div>
            </div>
          </div>

          {/* Selected Template Preview */}
          {selectedTemplate && (
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">Selected Template: {selectedTemplate.name}</h4>
              <div className="text-sm">
                <div className="text-muted-foreground">System Prompt:</div>
                <div className="bg-muted p-2 rounded text-xs">
                  {selectedTemplate.systemPrompt || 'No system prompt'}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">User Template:</div>
                <div className="bg-muted p-2 rounded text-xs">
                  {selectedTemplate.userTemplate || 'No user template'}
                </div>
              </div>
            </div>
          )}

          {/* Email Configuration */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email for Results
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              You'll receive the processing results via email
            </p>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{processedCount} / {totalRecords}</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                This may take a few minutes depending on your data size
              </p>
            </div>
          )}

          {/* Start Processing Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={simulateProcessing}
              disabled={isProcessing || !email}
              className="min-w-48"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Processing
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { RunStage };