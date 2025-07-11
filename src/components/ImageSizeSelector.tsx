
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface ImageSizeSelectorProps {
  onSizeChange: (width: number, height: number) => void;
  defaultSize?: string;
}

const ImageSizeSelector = ({ onSizeChange, defaultSize = "512×512" }: ImageSizeSelectorProps) => {
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const presetSizes = [
    "200×200",
    "512×512", 
    "768×768",
    "896×896",
    "1024×1024"
  ];

  const handlePresetSelect = (size: string) => {
    setSelectedSize(size);
    setIsCustom(false);
    const [width, height] = size.split('×').map(Number);
    onSizeChange(width, height);
  };

  const handleCustomSize = () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    if (width > 0 && height > 0) {
      setSelectedSize(`${width}×${height}`);
      setIsCustom(true);
      onSizeChange(width, height);
    }
  };

  const displaySize = isCustom ? `${customWidth}×${customHeight}` : selectedSize;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="underline text-lg border-none shadow-none p-0 h-auto">
          {displaySize}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Image Size</Label>
          
          <Select value={selectedSize} onValueChange={handlePresetSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {presetSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Size</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Width"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">×</span>
              <Input
                type="number"
                placeholder="Height"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCustomSize}
                size="sm"
                disabled={!customWidth || !customHeight}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ImageSizeSelector;
