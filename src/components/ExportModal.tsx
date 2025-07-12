
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormDataContext } from "@/contexts/form/type";
import { useToast } from "@/hooks/use-toast";
import { estimateTokens } from "@/lib/computations";
import { Copy, Download, FileText } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import PriceRangeWidget from "./PriceRangeWidget";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: FormDataContext;
  minCost: number;
  maxCost: number;
  minModel: string;
  maxModel: string;
}

const ExportModal = ({
  open,
  onOpenChange,
  data,
  minCost,
  maxCost,
  minModel,
  maxModel,
}: ExportModalProps) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState({
    copyImage: false,
    downloadImage: false,
  });

  const { toast } = useToast();
  const tokenStats = useMemo(() => {
    const tokenEstimates = estimateTokens(
      data.dataType,
      data.prompt,
      data.example,
      data.imageSize
    );

    const totalInputTokens = data.dataCount * tokenEstimates.input;
    const totalOutputTokens = data.dataCount * tokenEstimates.output;
    const totalTokens = totalInputTokens + totalOutputTokens;

    return {
      totalInput: totalInputTokens,
      totalOutput: totalOutputTokens,
      totalTokens,
    };
  }, [data]);

  const convertToImage = async (): Promise<Blob> => {
    if (!exportRef.current) {
      throw new Error("Export reference not found");
    }

    // Use html2canvas to convert the div to canvas
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: "#ffffff",
      scale: 2, // Higher resolution
      useCORS: true,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, "image/png");
    });
  };

  const handleCopyImage = async () => {
    try {
      setLoading((prev) => ({ ...prev, copyImage: true }));
      const blob = await convertToImage();
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      toast({
        title: "Image copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy image to clipboard:", err);
    } finally {
      setLoading((prev) => ({ ...prev, copyImage: false }));
    }
  };

  const handleDownloadImage = async () => {
    try {
      setLoading((prev) => ({ ...prev, downloadImage: true }));
      const blob = await convertToImage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-cost-estimation.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setLoading((prev) => ({ ...prev, downloadImage: false }));
    }
  };

  const handleCopyText = async () => {
    const text = `AI Model Cost Estimation
Data Count: ${data.dataCount.toLocaleString()} ${data.dataType}
Total Tokens: ${tokenStats.totalTokens.toLocaleString()}
Input Tokens: ${tokenStats.totalInput.toLocaleString()}
Output Tokens: ${tokenStats.totalOutput.toLocaleString()}
Price Range: $${minCost.toFixed(2)} - $${maxCost.toFixed(2)}
Cheapest: ${minModel}
Most Expensive: ${maxModel}`;

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Text copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy text to clipboard:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Preview */}
          <div
            ref={exportRef}
            className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-8 rounded-lg border"
          >
            {/* Sentence Summary */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">
                AI Model Cost Estimation
              </h2>
              <p className="text-lg text-muted-foreground">
                Processing {data.dataCount.toLocaleString()} {data.dataType}
              </p>
            </div>

            {/* Token Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Token Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {tokenStats.totalInput.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Input Tokens
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {tokenStats.totalOutput.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Output Tokens
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {tokenStats.totalTokens.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Tokens
                  </div>
                </div>
              </div>
            </div>

            {/* Price Range Widget */}
            <PriceRangeWidget data={data} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              loading={loading.copyImage}
              variant="outline"
              size="icon"
              onClick={handleCopyImage}
              title="Copy image to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              loading={loading.downloadImage}
              variant="outline"
              size="icon"
              onClick={handleDownloadImage}
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyText}
              title="Copy as text"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
