import { useFormContext } from "react-hook-form";
import DataCountSelector from "./DataCountSelector";
import DataTypeSelector from "./DataTypeSelector";
import ImageSizePopover from "./ImageSizePopover";
import ModelCapabilities from "./ModelCapabilities";
import ModelSizeSelector from "./ModelSizeSelector";

const SentenceInput = () => {
  const { watch } = useFormContext();
  const dataType = watch("dataType");

  return (
    <div>
      <div className="flex items-center gap-2 font-medium flex-wrap justify-center">
        <span>I have</span>
        <DataCountSelector />
        <DataTypeSelector />
        <span>to process</span>
        {dataType === "images" && (
          <>
            <span>of the size</span>
            <ImageSizePopover />
          </>
        )}
      </div>
      <div className="flex items-center gap-2 font-medium flex-wrap justify-center">
        <span>I need a </span>
        <ModelSizeSelector />
        <span>model that can </span>
        <ModelCapabilities />
      </div>
    </div>
  );
};

export default SentenceInput;
