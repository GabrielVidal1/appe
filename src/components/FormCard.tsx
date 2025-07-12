
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormContext } from "react-hook-form";
import { useConfigFromUrl } from "@/hooks/useConfigFromUrl";
import { FormDataContext } from "@/contexts/form/type";
import SentenceInput from "./form/SentenceInput";
import PromptInput from "./form/PromptInput";
import ExampleOutput from "./form/ExampleOutputs";
import SubmitButton from "./form/SubmitButton";
import HelpButton from "./HelpButton";
import HelpModal from "./HelpModal";

interface FormCardProps {
  onSubmit: (data: FormDataContext) => void;
  updatePrices?: boolean;
}

const FormCard = ({ onSubmit, updatePrices }: FormCardProps) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { handleSubmit, watch } = useFormContext();
  const dataType = watch("dataType");
  const prompt = watch("prompt");
  const { isConfigFromUrl } = useConfigFromUrl();

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
    <>
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
            <HelpButton onClick={() => setShowHelpModal(true)} />
            <SentenceInput />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col gap-4 items-center">
          <div className="w-full">
            <PromptInput />
          </div>

          <ExampleOutput className="w-full" />

          {!isConfigFromUrl && (
            <SubmitButton
              onClick={handleSubmit(onFormSubmit)}
              className="group/submit"
              disabled={!dataType || !prompt?.trim()}
              update={updatePrices}
            />
          )}
        </CardContent>
      </Card>

      <HelpModal 
        open={showHelpModal} 
        onOpenChange={setShowHelpModal} 
      />
    </>
  );
};

export default FormCard;
