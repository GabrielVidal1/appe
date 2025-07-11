
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, FormProvider } from "react-hook-form";
import SentenceInput from "./form/SentenceInput";
import PromptInput from "./form/PromptInput";
import ExampleOutputs from "./form/ExampleOutputs";

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

          <Button
            onClick={handleSubmit(onFormSubmit)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            disabled={!dataType || !prompt?.trim()}
          >
            Calculate Costs
          </Button>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default EstimatorForm;
