import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import ExampleTemplates from "./ExampleTemplates";
import ExampleOutputs from "./form/ExampleOutputs";
import ImageSizeSelector from "./ImageSizeSelector";

interface EstimatorFormProps {
  onSubmit: (data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    examples: string[];
    imageSize?: { width: number; height: number };
  }) => void;
}

const EstimatorForm = ({ onSubmit }: EstimatorFormProps) => {
  const [dataCount, setDataCount] = useState([1000]);
  const [dataType, setDataType] = useState("prompts");
  const [prompt, setPrompt] = useState("");
  const [examples, setExamples] = useState<string[]>([""]);
  const [imageSize, setImageSize] = useState({ width: 512, height: 512 });

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

  const handleImageSizeChange = (width: number, height: number) => {
    setImageSize({ width, height });
  };

  const handleExampleSelect = (
    examplePrompt: string,
    exampleOutput: string
  ) => {
    setPrompt(examplePrompt);
    // Replace the first example or add it if no examples exist
    if (examples.length === 0) {
      setExamples([exampleOutput]);
    } else {
      const newExamples = [...examples];
      newExamples[0] = exampleOutput;
      setExamples(newExamples);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      dataCount: dataCount[0],
      dataType,
      prompt,
      examples: examples.filter((ex) => ex.trim() !== ""),
      imageSize: dataType === "images" ? imageSize : undefined,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          <div className="flex items-center gap-2 font-medium flex-wrap justify-center">
            <span>I have</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="font-medium underline cursor-pointer">
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
              <SelectTrigger className="underline text-xl font-medium w-auto border-none shadow-none p-0 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prompts">prompts</SelectItem>
                <SelectItem value="images">images</SelectItem>
              </SelectContent>
            </Select>
            <span>to process</span>
            {dataType === "images" && (
              <>
                <span>of the size</span>
                <ImageSizeSelector
                  className="text-xl font-medium"
                  onSizeChange={handleImageSizeChange}
                  defaultSize="512×512"
                />
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col gap-4">
        <div className="space-y-4">
          <div className="space-y-2 relative">
            {/* <Label htmlFor="prompt">Example Prompt</Label> */}
            <Textarea
              id="prompt"
              placeholder="Example prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {prompt.trim().length == 0 && (
              <ExampleTemplates
                className="absolute bottom-2 right-2"
                dataType={dataType}
                onSelectExample={handleExampleSelect}
              />
            )}
          </div>
        </div>

        <ExampleOutputs
          examples={examples}
          addExample={addExample}
          removeExample={removeExample}
          updateExample={updateExample}
        />

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
