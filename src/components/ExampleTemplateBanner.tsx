import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import ExampleTemplates from "./ExampleTemplates";
import { Button } from "./ui/button";

interface ExampleTemplateBannerProps {
  showExamples: boolean;
  onExampleSelect: () => void;
  onClose?: () => void;
  isConfigFromUrl: boolean;
}

const ExampleTemplateBanner = ({
  showExamples,
  onExampleSelect,
  isConfigFromUrl,
  onClose,
}: ExampleTemplateBannerProps) => {
  if (isConfigFromUrl || !showExamples) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center",
        "z-0 transition-transform duration-300 ease-in-out",
        "group-hover:-translate-y-1/2 -translate-y-[120%] opacity-0 group-hover:opacity-100",
        "pointer-events-none"
      )}
    >
      <div className="relative w-full h-[75px]">
        <Card className="absolute w-full shadow-lg pt-6 bottom-[60%] -top-[60%] pointer-events-auto">
          <CardContent className="flex items-center gap-2 text-nowrap">
            Try these examples: <span className="flex-1 text-sm" />
            <ExampleTemplates
              onExampleSelect={onExampleSelect}
              className="w-full overflow-x-scroll"
            />
            {onClose && (
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700"
                onClick={onClose}
                aria-label="Close examples"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExampleTemplateBanner;
