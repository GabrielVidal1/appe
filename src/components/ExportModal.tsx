import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDataContext } from "@/contexts/form/type";
import { useToast } from "@/hooks/use-toast";
import { estimateTokens } from "@/lib/computations";
import { CAPABILITIES_FROM_TAG } from "@/lib/constants";
import { Copy, Download, FileText, Share2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import PriceRangeWidget from "./PriceRangeWidget";
import { ShareConfigButton } from "./ShareConfigButton";

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
  const [configName, setConfigName] = useState("");
  const [loading, setLoading] = useState({
    copyImage: false,
    downloadImage: false,
    downloadCsv: false,
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
      // foreignObjectRendering: true,
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
      toast({
        title: "Failed to copy image",
        variant: "destructive",
      });
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
      a.download = configName
        ? `${configName}-estimation.png`
        : "ai-cost-estimation.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Image downloaded",
      });
    } catch (err) {
      console.error("Failed to download image:", err);
      toast({
        title: "Failed to download image",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, downloadImage: false }));
    }
  };

  const handleCopyText = async () => {
    const text = `AI Model Cost Estimation${
      configName ? ` - ${configName}` : ""
    }
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
      toast({
        title: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setLoading((prev) => ({ ...prev, downloadCsv: true }));

      const csvContent = `Configuration Name,Data Count,Data Type,Total Tokens,Input Tokens,Output Tokens,Min Cost,Max Cost,Cheapest Model,Most Expensive Model
"${configName || "Untitled"}",${data.dataCount},"${data.dataType}",${
        tokenStats.totalTokens
      },${tokenStats.totalInput},${tokenStats.totalOutput},${minCost.toFixed(
        2
      )},${maxCost.toFixed(2)},"${minModel}","${maxModel}"`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = configName
        ? `${configName}-estimation.csv`
        : "ai-cost-estimation.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV downloaded",
      });
    } catch (err) {
      console.error("Failed to download CSV:", err);
      toast({
        title: "Failed to download CSV",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, downloadCsv: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Export Results</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div
              ref={exportRef}
              className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-8 rounded-lg border"
            >
              {/* Sentence Summary */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  AI Model Cost Estimation
                </h2>
                {configName && (
                  <p className="text-lg font-medium text-primary mb-2">
                    {configName}
                  </p>
                )}
                <p className="text-lg text-muted-foreground">
                  Processing
                  <span className="underline mx-1">
                    {data.dataCount.toLocaleString()}
                  </span>
                  <span className="underline mx-1">{data.dataType}</span>
                  with a<span className="underline mx-1">{data.modelSize}</span>
                  model
                  {data.modelCapabilities.length > 0 && (
                    <>
                      {" "}
                      that can
                      <span className="underline ml-1">
                        {data.modelCapabilities
                          .map((cap) => CAPABILITIES_FROM_TAG[cap] || cap)
                          .join(", ")}
                      </span>
                    </>
                  )}
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
          </div>

          {/* Right Panel - Export Options */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Export Options</h3>

              {/* Configuration Name */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="config-name">
                  Configuration Name (Optional)
                </Label>
                <Input
                  id="config-name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Enter a name for this configuration..."
                />
              </div>

              {/* Image Export */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium">Image Export</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyImage}
                    disabled={loading.copyImage}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {loading.copyImage ? "Copying..." : "Copy Image"}
                  </Button>
                  <Button
                    onClick={handleDownloadImage}
                    disabled={loading.downloadImage}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {loading.downloadImage
                      ? "Downloading..."
                      : "Download Image"}
                  </Button>
                </div>
              </div>

              {/* Text Export */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium">Text Export</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyText}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Copy Text
                  </Button>
                  <Button
                    onClick={handleDownloadCsv}
                    disabled={loading.downloadCsv}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {loading.downloadCsv ? "Downloading..." : "Download CSV"}
                  </Button>
                </div>
              </div>

              {/* Share */}
              <div className="space-y-3">
                <h4 className="font-medium">Share</h4>
                <ShareConfigButton
                  icon={<Share2 className="h-4 w-4 mr-2" />}
                  className="w-full justify-center"
                  copyOnClick
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
