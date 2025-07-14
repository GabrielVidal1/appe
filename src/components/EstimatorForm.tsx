import { useConfigFromUrl } from "@/hooks/useConfigFromUrl";
import { AppData } from "@/types/appData";
import { memo, useCallback, useState } from "react";
import ExampleTemplateBanner from "./ExampleTemplateBanner";
import FormCard from "./FormCard";

interface EstimatorFormProps {
  onSubmit: (data: AppData) => void;
  updatePrices?: boolean;
}

const EstimatorForm = ({ onSubmit, updatePrices }: EstimatorFormProps) => {
  const [showExamples, setShowExamples] = useState(true);
  const { isConfigFromUrl } = useConfigFromUrl();

  const onFormSubmit = useCallback((data: AppData) => {
    onSubmit({
      ...data,
      imageSize: data.dataType === "images" ? data.imageSize : undefined,
      pdfData: data.dataType === "pdfs" ? data.pdfData : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="">
      <div className="relative w-full mb-6">
        <div className="w-full z-100 mt-20">
          <FormCard onSubmit={onFormSubmit} updatePrices={updatePrices} />
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
