import { useFormContext } from "react-hook-form";
import { TextareaWithCounts } from "../ui/textarea-with-counts";

const ExampleOutputs = () => {
  const { watch, setValue } = useFormContext();
  const example = watch("example") || "";

  const updateExample = (value: string) => {
    setValue("example", value);
  };

  return (
    <div className="space-y-4">
      <TextareaWithCounts
        placeholder={`Example output`}
        value={example}
        onChange={(e) => updateExample(e.target.value)}
        className="flex-1 resize-none"
        rows={4}
      />
    </div>
  );
};

export default ExampleOutputs;
