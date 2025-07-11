
import DataCountSelector from "./DataCountSelector";
import DataTypeSelector from "./DataTypeSelector";
import ImageSizePopover from "./ImageSizePopover";
import { useFormContext } from "react-hook-form";

const SentenceInput = () => {
  const { watch } = useFormContext();
  const dataType = watch("dataType");

  return (
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
  );
};

export default SentenceInput;
