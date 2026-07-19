import { Input } from "@/components/ui/input";
import ProviderCombobox from "@/components/ProviderCombobox";
import { Search } from "lucide-react";

interface FilterControlsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedProvider: string;
  setSelectedProvider: (value: string) => void;
}

const FilterControls = ({
  searchTerm,
  setSearchTerm,
  selectedProvider,
  setSelectedProvider,
}: FilterControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 flex-1"
        />
      </div>

      {/* Searchable provider picker — the models.dev catalogue lists ~50+
          providers, so a plain dropdown was unusable. Shows a handful at a
          time; type to reach the rest. */}
      <ProviderCombobox
        value={selectedProvider}
        onChange={setSelectedProvider}
      />
    </div>
  );
};

export default FilterControls;
