import { Plus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface ExampleOutputsProps {
  examples: string[];
  addExample: () => void;
  removeExample: (index: number) => void;
  updateExample: (index: number, value: string) => void;
}

const ExampleOutputs: React.FC<ExampleOutputsProps> = ({
  examples,
  addExample,
  removeExample,
  updateExample,
}) => {
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

      {examples.map((example, index) => (
        <div key={index} className="flex gap-2">
          <Textarea
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
