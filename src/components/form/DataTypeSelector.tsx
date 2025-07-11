import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const DataTypeSelector = () => {
  const { watch, setValue } = useFormContext();
  const dataType = watch("dataType");
  const modelCapabilities: string[] = watch("modelCapabilities");

  const handleValueChange = (value: string) => {
    setValue("dataType", value);
  };

  useEffect(() => {
    if (dataType === "images") {
      const addedVisionCapabilities = new Set([...modelCapabilities, "vision"]);
      setValue("modelCapabilities", Array.from(addedVisionCapabilities));
    } else {
      const removedVisionCapabilities = modelCapabilities.filter(
        (capability) => capability !== "vision"
      );
      setValue("modelCapabilities", removedVisionCapabilities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataType]);

  return (
    <Select value={dataType} onValueChange={handleValueChange}>
      <SelectTrigger className="underline text-xl font-medium w-auto border-none shadow-none p-0 h-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="prompts">prompts</SelectItem>
        <SelectItem value="images">images</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default DataTypeSelector;
