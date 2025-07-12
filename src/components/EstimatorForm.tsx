import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDataContext } from "@/contexts/form/type";
import { useFormContext } from "react-hook-form";
import ExampleOutput from "./form/ExampleOutputs";
import PromptInput from "./form/PromptInput";
import SentenceInput from "./form/SentenceInput";
import { getProviderIcon } from "./ProviderIcons";
import { Button } from "./ui/button";

interface EstimatorFormProps {
  onSubmit: (data: FormDataContext) => void;
}

const EstimatorForm = ({ onSubmit }: EstimatorFormProps) => {
  const { handleSubmit, watch } = useFormContext();
  const dataType = watch("dataType");
  const prompt = watch("prompt");
  const dataCount = watch("dataCount");
  const example = watch("example");
  const imageSize = watch("imageSize");

  const onFormSubmit = (data: FormDataContext) => {
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
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          <SentenceInput />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col gap-4 items-center">
        <div className="space-y-4 w-full">
          <PromptInput />
        </div>

        <ExampleOutput className="w-full" />

        <Button
          onClick={handleSubmit(onFormSubmit)}
          className="w-fit bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg group"
          disabled={!dataType || !prompt?.trim()}
        >
          Show provider prices
          <div className="flex items-center gap-2 ml-2 ">
            {getProviderIcon("openai", "group-hover:animate-spin")}
            {getProviderIcon("claude", "group-hover:animate-spin")}
            {getProviderIcon("mistral", "group-hover:animate-spin")}
          </div>
        </Button>
      </CardContent>
    </Card>
  );
};

export default EstimatorForm;
