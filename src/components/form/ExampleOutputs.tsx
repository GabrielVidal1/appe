import { Plus, X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { TextareaWithCounts } from "../ui/textarea-with-counts";

const ExampleOutputs = () => {
  const { watch, setValue } = useFormContext();
  const examples = watch("examples") || [""];

  const addExample = () => {
    setValue("examples", [...examples, ""]);
  };

  const removeExample = (index: number) => {
    const newExamples = examples.filter((_: string, i: number) => i !== index);
    setValue("examples", newExamples);
  };

  const updateExample = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setValue("examples", newExamples);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium">Example Outputs</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExample}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Example
        </Button>
      </div>

      {examples.map((example: string, index: number) => (
        <div key={index} className="flex gap-2">
          <TextareaWithCounts
            placeholder={`Example output ${index + 1}...`}
            value={example}
            onChange={(e) => updateExample(index, e.target.value)}
            className="flex-1 resize-none"
            rows={2}
          />
          {examples.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeExample(index)}
              className="self-start mt-1"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExampleOutputs;
