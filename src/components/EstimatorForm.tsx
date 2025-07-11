
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, X } from "lucide-react";

interface EstimatorFormProps {
  onSubmit: (data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    examples: string[];
  }) => void;
}

const EstimatorForm = ({ onSubmit }: EstimatorFormProps) => {
  const [dataCount, setDataCount] = useState([1000]);
  const [dataType, setDataType] = useState("");
  const [prompt, setPrompt] = useState("");
  const [examples, setExamples] = useState<string[]>([""]);

  const addExample = () => {
    setExamples([...examples, ""]);
  };

  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const updateExample = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };

  const handleSubmit = () => {
    onSubmit({
      dataCount: dataCount[0],
      dataType,
      prompt,
      examples: examples.filter(ex => ex.trim() !== "")
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Cost Estimator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            I have {dataCount[0].toLocaleString()} items to process
          </Label>
          <Slider
            value={dataCount}
            onValueChange={setDataCount}
            max={10000}
            min={200}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>200</span>
            <span>10,000</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataType">Data Type</Label>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger>
              <SelectValue placeholder="Select data type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="files">Files</SelectItem>
              <SelectItem value="pdfs">PDFs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Processing Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe what you want the AI to do with your data..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

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
              <Input
                placeholder={`Example output ${index + 1}...`}
                value={example}
                onChange={(e) => updateExample(index, e.target.value)}
                className="flex-1"
              />
              {examples.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeExample(index)}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          disabled={!dataType || !prompt.trim()}
        >
          Calculate Costs
        </Button>
      </CardContent>
    </Card>
  );
};

export default EstimatorForm;
