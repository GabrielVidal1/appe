import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDataContext } from "@/contexts/form/type";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import ExampleTemplates from "./ExampleTemplates";
import ExampleOutput from "./form/ExampleOutputs";
import PromptInput from "./form/PromptInput";
import SentenceInput from "./form/SentenceInput";
import SubmitButton from "./form/SubmitButton";

interface EstimatorFormProps {
  onSubmit: (data: FormDataContext) => void;
  updatePrices?: boolean;
}

const EstimatorForm = ({ onSubmit, updatePrices }: EstimatorFormProps) => {
  const { handleSubmit, watch } = useFormContext();
  const dataType = watch("dataType");
  const prompt = watch("prompt");
  const dataCount = watch("dataCount");
  const example = watch("example");
  const imageSize = watch("imageSize");

  const onFormSubmit = useCallback((data: FormDataContext) => {
    onSubmit({
      dataCount: data.dataCount,
      dataType: data.dataType,
      prompt: data.prompt,
      example: data.example.trim(),
      imageSize: dataType === "images" ? data.imageSize : undefined,
      modelSize: data.modelSize,
      modelCapabilities: data.modelCapabilities,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset form values when the form is submitted
    if (updatePrices) {
      handleSubmit(onFormSubmit)();
    }
  }, [updatePrices, handleSubmit, onFormSubmit]);

  return (
    <div className="group">
      <div className="relative w-full mb-6 ">
        <div className="w-full z-100 mt-20">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                <SentenceInput />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex flex-col gap-4 items-center">
              <div className="w-full">
                <PromptInput />
              </div>

              <ExampleOutput className="w-full" />

              <SubmitButton
                onClick={handleSubmit(onFormSubmit)}
                className=" group"
                disabled={!dataType || !prompt?.trim()}
                update={updatePrices}
              />
            </CardContent>
          </Card>
        </div>
        <div
          className={cn(
            "absolute inset-0 flex items-center",
            "z-0 transition-transform duration-300 ease-in-out",
            "group-hover:-translate-y-1/2 -translate-y-[120%] opacity-0 group-hover:opacity-100",
            "pointer-events-none"
          )}
        >
          <div className="relative w-full h-[75px]">
            <Card className="absolute w-full shadow-lg pt-6 bottom-[60%] -top-[60%]">
              <CardContent className="flex justify-between items-center">
                Try these examples: <ExampleTemplates />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimatorForm;
