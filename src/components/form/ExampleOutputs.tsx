import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { TextareaWithCounts } from "../ui/textarea-with-counts";

const ExampleOutput = () => {
  const { watch, setValue } = useFormContext();
  const example = watch("example") || "";

  const updateExample = (value: string) => {
    setValue("example", value);
  };

  const formattedExample = useMemo(() => {
    let formatted = example.trim();
    if (formatted.startsWith("{") && formatted.endsWith("}")) {
      formatted = JSON.stringify(JSON.parse(formatted), null, 2);
    }
    return formatted;
  }, [example]);

  return (
    <div className="space-y-4">
      <TextareaWithCounts
        placeholder={`Example output`}
        value={formattedExample}
        onChange={(e) => updateExample(e.target.value)}
        className="flex-1 resize-none font-mono pr-10 text-xs"
        rows={4}
      />
    </div>
  );
};

export default ExampleOutput;
