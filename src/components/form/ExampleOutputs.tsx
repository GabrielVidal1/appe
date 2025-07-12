import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { TextareaWithCounts } from "../ui/textarea-with-counts";

interface ExampleOutputProps {
  className?: string;
}

const ExampleOutput = ({ className }: ExampleOutputProps) => {
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
    <div className={className}>
      <TextareaWithCounts
        placeholder="Enter your example output here..."
        value={formattedExample}
        onChange={(e) => updateExample(e.target.value)}
        className="flex-1 resize-none font-mono pr-10 text-xs"
        rows={Math.max(
          2,
          Math.min(
            15,
            Math.max(
              formattedExample.split("\n").length,
              formattedExample.length / 80
            )
          )
        )}
      />
    </div>
  );
};

export default ExampleOutput;
