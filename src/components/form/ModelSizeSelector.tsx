import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const ModelSizeSelector = () => {
  const { watch, setValue } = useFormContext();
  const modelSize = watch("modelSize");

  const handleValueChange = (value: string) => {
    setValue("modelSize", value);
  };

  useEffect(() => {
    setValue("selectedTiers", [modelSize]);
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
