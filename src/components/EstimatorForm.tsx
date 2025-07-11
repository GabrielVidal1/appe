
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [dataType, setDataType] = useState("prompt");
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

  const renderPromptSection = () => (
    <div className="space-y-2">
      <Label htmlFor="prompt">Processing Prompt</Label>
      <Textarea
        id="prompt"
        placeholder="example"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="resize-none"
      />
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Cost Estimator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-lg">
          <span>I have</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer">
                {dataCount[0].toLocaleString()}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Number of items: {dataCount[0].toLocaleString()}
                </Label>
                <Slider
                  value={dataCount}
                  onValueChange={setDataCount}
                  max={10000}
                  min={200}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>200</span>
                  <span>10,000</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger className="w-auto border-none shadow-none p-0 h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prompt">prompts</SelectItem>
            </SelectContent>
          </Select>
          <span>to process</span>
        </div>

        {dataType === "prompt" && renderPromptSection()}

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
