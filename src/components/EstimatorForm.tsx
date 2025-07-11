
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, FormProvider } from "react-hook-form";
import SentenceInput from "./form/SentenceInput";
import PromptInput from "./form/PromptInput";
import ExampleOutputs from "./form/ExampleOutputs";
import { estimateTokens } from "@/lib/computations";
import { useMemo } from "react";

interface FormData {
  dataCount: number;
  dataType: string;
  prompt: string;
  examples: string[];
  imageSize?: { width: number; height: number };
}

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
  const methods = useForm<FormData>({
    defaultValues: {
      dataCount: 1000,
      dataType: "prompts",
      prompt: "",
      examples: [""],
      imageSize: { width: 512, height: 512 },
    },
  });

  const { handleSubmit, watch } = methods;
  const dataType = watch("dataType");
  const prompt = watch("prompt");
  const dataCount = watch("dataCount");
  const examples = watch("examples");
  const imageSize = watch("imageSize");

  const tokenStats = useMemo(() => {
    if (!prompt?.trim()) return null;

    const tokenEstimates = estimateTokens(
      dataType,
      prompt,
      examples.filter(ex => ex.trim() !== ""),
      dataType === "images" ? imageSize : undefined
    );

    const totalInputTokens = dataCount * tokenEstimates.input;
    const totalOutputTokens = dataCount * tokenEstimates.output;
    const totalTokens = totalInputTokens + totalOutputTokens;

    return {
      singleItemInput: tokenEstimates.input,
      singleItemOutput: tokenEstimates.output,
      singleItemTotal: tokenEstimates.input + tokenEstimates.output,
      totalInput: totalInputTokens,
      totalOutput: totalOutputTokens,
      totalTokens,
    };
  }, [dataType, prompt, examples, imageSize, dataCount]);

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      dataCount: data.dataCount,
      dataType: data.dataType,
      prompt: data.prompt,
      examples: data.examples.filter((ex) => ex.trim() !== ""),
      imageSize: dataType === "images" ? data.imageSize : undefined,
    });
  };

  return (
    <FormProvider {...methods}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            <SentenceInput />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col gap-4">
          <div className="space-y-4">
            <PromptInput />
          </div>

          <ExampleOutputs />

          {tokenStats && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Token Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Single Item</div>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span>Input:</span>
                        <span className="font-mono">{tokenStats.singleItemInput.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Output:</span>
                        <span className="font-mono">{tokenStats.singleItemOutput.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span className="font-mono">{tokenStats.singleItemTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">All Items ({dataCount.toLocaleString()})</div>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span>Input:</span>
                        <span className="font-mono">{tokenStats.totalInput.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Output:</span>
                        <span className="font-mono">{tokenStats.totalOutput.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span className="font-mono">{tokenStats.totalTokens.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSubmit(onFormSubmit)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            disabled={!dataType || !prompt?.trim()}
          >
            Show provider prices
          </Button>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default EstimatorForm;
