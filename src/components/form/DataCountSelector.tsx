import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useFormContext } from "react-hook-form";

const DataCountSelector = () => {
  const { watch, setValue } = useFormContext();
  const dataCount = watch("dataCount");

  const handleValueChange = (value: number[]) => {
    setValue("dataCount", value[0]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="font-medium text-xl underline cursor-pointer p-0 h-auto"
        >
          {dataCount?.toLocaleString() || "1000"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <Label className="text-sm font-medium">
            Number of items: {dataCount?.toLocaleString() || "1000"}
          </Label>
          <Slider
            value={[dataCount || 1000]}
            onValueChange={handleValueChange}
            max={10000}
            min={200}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>200</span>
            <span>10,000</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DataCountSelector;
