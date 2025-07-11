
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

const DataTypeSelector = () => {
  const { watch, setValue } = useFormContext();
  const dataType = watch("dataType");

  const handleValueChange = (value: string) => {
    setValue("dataType", value);
  };

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
