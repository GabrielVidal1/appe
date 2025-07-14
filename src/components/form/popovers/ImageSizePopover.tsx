import ImageSizeSelector from "@/components/ImageSizeSelector";
import { useFormContext } from "react-hook-form";

const ImageSizePopover: React.FC = () => {
  const { setValue, watch } = useFormContext();

  const imageSize = watch("imageSize");
  const defaultSize = imageSize || { width: 512, height: 512 };
  const handleSizeChange = (width: number, height: number) => {
    setValue("imageSize", { width, height });
  };

  return (
    <ImageSizeSelector
      className="text-xl font-medium"
      onSizeChange={handleSizeChange}
      defaultSize={`${defaultSize.width}×${defaultSize.height}`}
    />
  );
};

export default ImageSizePopover;
