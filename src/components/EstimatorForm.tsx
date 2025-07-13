import { useConfigFromUrl } from "@/hooks/useConfigFromUrl";
import { AppData } from "@/types/appData";
import { memo, useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import ExampleTemplateBanner from "./ExampleTemplateBanner";
import FormCard from "./FormCard";

interface EstimatorFormProps {
  onSubmit: (data: AppData) => void;
  updatePrices?: boolean;
}

const EstimatorForm = ({ onSubmit, updatePrices }: EstimatorFormProps) => {
  const [showExamples, setShowExamples] = useState(true);
  const { handleSubmit } = useFormContext();
  const { isConfigFromUrl } = useConfigFromUrl();

  const onFormSubmit = useCallback((data: AppData) => {
    onSubmit({
      dataCount: data.dataCount,
      dataType: data.dataType,
      prompt: data.prompt,
      example: data.example.trim(),
      imageSize: data.dataType === "images" ? data.imageSize : undefined,
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
    <div className="">
      <div className="relative w-full mb-6">
        <div className="w-full z-100 mt-20">
          <FormCard onSubmit={onSubmit} updatePrices={updatePrices} />
        </div>

        <ExampleTemplateBanner
          showExamples={showExamples}
          onExampleSelect={() => {}}
          onClose={() => setShowExamples(false)}
          isConfigFromUrl={isConfigFromUrl}
        />
      </div>
    </div>
  );
};

export default memo(EstimatorForm);
