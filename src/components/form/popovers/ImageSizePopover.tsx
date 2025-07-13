import ImageSizeSelector from "@/components/ImageSizeSelector";
import { useFormContext } from "react-hook-form";

const ImageSizePopover: React.FC = () => {
  const { setValue } = useFormContext();

  const handleSizeChange = (width: number, height: number) => {
    setValue("imageSize", { width, height });
  };

  return (
    <ImageSizeSelector
      className="text-xl font-medium"
      onSizeChange={handleSizeChange}
      defaultSize="512×512"
    />
  );
};

export default ImageSizePopover;
