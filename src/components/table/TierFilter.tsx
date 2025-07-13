import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_TIERS } from "@/data";
import { AppData } from "@/types/appData";
import { Filter } from "lucide-react";

interface TierFilterProps {
  selectedTiers: AppData["modelSize"][];
  setSelectedTiers: (
    updater: (prev: AppData["modelSize"][]) => AppData["modelSize"][]
  ) => void;
}

const TierFilter = ({ selectedTiers, setSelectedTiers }: TierFilterProps) => {
  const handleTierChange = (tier: AppData["modelSize"], checked: boolean) => {
    setSelectedTiers((prev) =>
      checked ? [...prev, tier] : prev.filter((t) => t !== tier)
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Filter by Tier</h4>
          {ALL_TIERS.map((tier) => (
            <div key={tier} className="flex items-center space-x-2">
              <Checkbox
                id={`tier-${tier}`}
                checked={selectedTiers.includes(tier)}
                onCheckedChange={(checked) => handleTierChange(tier, !!checked)}
              />
              <Label htmlFor={`tier-${tier}`} className="text-sm capitalize">
                {tier}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TierFilter;
