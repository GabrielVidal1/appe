import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const DataTypePopover = () => {
  const { watch, setValue } = useFormContext();
  const dataType = watch("dataType");
  const modelCapabilities: string[] = watch("modelCapabilities");

  const handleValueChange = (value: string) => {
    setValue("dataType", value);
  };

  // Keep the required capability filter in sync with the data type: image input
  // needs "vision", audio input needs "audio". Drop both otherwise.
  useEffect(() => {
    const required =
      dataType === "images" ? "vision" : dataType === "audio" ? "audio" : null;
    const next = modelCapabilities.filter(
      (c) => c !== "vision" && c !== "audio"
    );
    if (required) next.push(required);
    setValue("modelCapabilities", next);
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
        <SelectItem value="pdfs">pdfs</SelectItem>
        <SelectItem value="audio">audio</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default DataTypePopover;
