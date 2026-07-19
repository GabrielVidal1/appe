import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PROVIDERS } from "@appe/core";
import { useState } from "react";
import HelpButton from "./HelpButton";

// The models.dev catalogue lists ~150 providers, but only a handful actually
// offer a batch discount — the rest would just be "0% off" noise. List the ones
// that give a real discount, deepest first.
const BATCH_DISCOUNT_PROVIDERS = Object.entries(PROVIDERS)
  .filter(([, p]) => p.batchDiscount < 1)
  .sort((a, b) => a[1].batchDiscount - b[1].batchDiscount);

interface BatchPricingToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const BatchPricingToggle: React.FC<BatchPricingToggleProps> = ({
  checked,
  onCheckedChange,
  className,
}) => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={helpOpen} onOpenChange={setHelpOpen}>
        <PopoverTrigger asChild>
          <div>
            <HelpButton
              className="border-none p-0 rounded-full"
              onClick={() => setHelpOpen(!helpOpen)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">
              Batch Processing Discounts
            </h4>
            <p className="text-xs text-muted-foreground">
              Batch processing allows you to process multiple requests together
              at a discounted rate.
            </p>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {BATCH_DISCOUNT_PROVIDERS.map(([key, provider]) => (
                <div
                  key={key}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-green-600 font-semibold">
                    {Math.round((1 - provider.batchDiscount) * 100)}% off
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Label htmlFor="batch-toggle" className="text-sm font-medium">
        Batch Pricing
      </Label>
      <Switch
        id="batch-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};

export default BatchPricingToggle;
