import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const TIERS_IN_ORDER = ["small", "medium", "big"];

const ModelSizeSelector = () => {
  const { watch, setValue } = useFormContext();
  const modelSize = watch("modelSize");

  const handleValueChange = (value: string) => {
    setValue("modelSize", value);
  };

  useEffect(() => {
    const newSelectedTiers = TIERS_IN_ORDER.filter(
      (tier) =>
        TIERS_IN_ORDER.indexOf(tier) >= TIERS_IN_ORDER.indexOf(modelSize)
    );
    setValue("selectedTiers", newSelectedTiers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelSize]);

  return (
    <Select value={modelSize} onValueChange={handleValueChange}>
      <SelectTrigger className="underline text-xl font-medium w-auto border-none shadow-none p-0 h-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="small">small</SelectItem>
        <SelectItem value="medium">medium</SelectItem>
        <SelectItem value="big">big</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ModelSizeSelector;
