import { DataType } from "@/types/appData";
import { useFormContext } from "react-hook-form";
import DataCountPopover from "./popovers/DataCountPopover";
import DataPdfPopover from "./popovers/DataPdfPopover";
import DataTypePopover from "./popovers/DataTypePopover";
import ImageSizePopover from "./popovers/ImageSizePopover";
import ModelSizePopover from "./popovers/ModelSizePopover";
import ModelTagsPopover from "./popovers/ModelTagsPopover";

const SentenceInput = () => {
  const { watch } = useFormContext();
  const dataType: DataType = watch("dataType");

  return (
    <div>
      <div className="flex items-center gap-2 font-medium flex-wrap justify-center">
        <span>I have</span>
        <DataCountPopover />
        <DataTypePopover />
        <span>to process</span>
        {dataType === "images" && (
          <>
            <span>of the size</span>
            <ImageSizePopover />
          </>
        )}
        {dataType === "pdfs" && (
          <>
            <span>of</span>
            <DataPdfPopover />
            <span>in average</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 font-medium flex-wrap justify-center">
        <span>I need a </span>
        <ModelSizePopover />
        <span>model that can </span>
        <ModelTagsPopover />
      </div>
    </div>
  );
};

export default SentenceInput;
