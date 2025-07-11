import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormData } from "@/lib/types";
import { FormProvider, useForm } from "react-hook-form";
import ExampleOutputs from "./form/ExampleOutputs";
import PromptInput from "./form/PromptInput";
import SentenceInput from "./form/SentenceInput";
import TokenEstimator from "./TokenEstimator";

interface EstimatorFormProps {
  onSubmit: (data: {
    dataCount: number;
    dataType: string;
    prompt: string;
    example: string;
    imageSize?: { width: number; height: number };
    modelSize: "small" | "medium" | "big";
    modelCapabilities: string[];
  }) => void;
}

const EstimatorForm = ({ onSubmit }: EstimatorFormProps) => {
  const methods = useForm<FormData>({
    defaultValues: {
      dataCount: 1000,
      dataType: "prompts",
      prompt: "",
      example: "",
      imageSize: { width: 512, height: 512 },
      modelSize: "medium",
      modelCapabilities: [],
    },
  });

  const { handleSubmit, watch } = methods;
  const dataType = watch("dataType");
  const prompt = watch("prompt");
  const dataCount = watch("dataCount");
  const example = watch("example");
  const imageSize = watch("imageSize");

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      dataCount: data.dataCount,
      dataType: data.dataType,
      prompt: data.prompt,
      example: data.example.trim(),
      imageSize: dataType === "images" ? data.imageSize : undefined,
      modelSize: data.modelSize,
      modelCapabilities: data.modelCapabilities,
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

          <TokenEstimator
            dataCount={dataCount}
            dataType={dataType}
            prompt={prompt}
            example={example}
            imageSize={imageSize}
          />

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
