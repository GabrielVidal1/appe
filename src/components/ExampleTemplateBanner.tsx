
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ExampleTemplates from "./ExampleTemplates";

interface ExampleTemplateBannerProps {
  showExamples: boolean;
  onExampleSelect: () => void;
  isConfigFromUrl: boolean;
}

const ExampleTemplateBanner = ({ 
  showExamples, 
  onExampleSelect, 
  isConfigFromUrl 
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
        <Card className="absolute w-full shadow-lg pt-6 bottom-[60%] -top-[60%]">
          <CardContent className="flex justify-between items-center">
            Try these examples:{" "}
            <ExampleTemplates onExampleSelect={onExampleSelect} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExampleTemplateBanner;
