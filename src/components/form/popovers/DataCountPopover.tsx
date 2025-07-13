import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useFormContext } from "react-hook-form";

const DataCountPopover: React.FC = () => {
  const { watch, setValue } = useFormContext();
  const dataCount = watch("dataCount");

  const handleValueChange = (value: number[]) => {
    setValue("dataCount", value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value.replace(/,/g, ""));
    if (!isNaN(val)) {
      setValue("dataCount", Math.max(0, val));
    }
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
          <Label className="text-sm font-medium flex items-center gap-2">
            Number of items:
            <input
              type="number"
              step={100}
              min={100}
              value={dataCount || 1000}
              onChange={handleInputChange}
              className="border rounded px-2 py-1 w-24 text-right"
            />
          </Label>
          <Slider
            value={[dataCount || 1000]}
            onValueChange={handleValueChange}
            max={10000}
            min={100}
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

export default DataCountPopover;
