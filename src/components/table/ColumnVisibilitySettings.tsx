import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

const COLUMNS_HIDEABLE = [
  "size",
  "inputOutput",
  "tags",
  "cachedTokens",
] as const;

type ColumnKey = (typeof COLUMNS_HIDEABLE)[number];

interface ColumnVisibilitySettingsProps {
  showColumns: Partial<Record<ColumnKey, boolean>>;
  setShowColumns: (
    updater: (prev: Record<ColumnKey, boolean>) => Record<ColumnKey, boolean>
  ) => void;
}

const ColumnVisibilitySettings = ({
  showColumns,
  setShowColumns,
}: ColumnVisibilitySettingsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <h4 className="font-medium">Column Visibility</h4>
          {COLUMNS_HIDEABLE.map((key) => (
            <div key={key} className="flex items-center space-x-2">
              <Switch
                id={`show-${key}`}
                checked={showColumns[key]}
                onCheckedChange={(checked) =>
                  setShowColumns((prev) => ({
                    ...prev,
                    [key]: checked,
                  }))
                }
              />
              <Label htmlFor={`show-${key}`} className="text-sm">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnVisibilitySettings;
