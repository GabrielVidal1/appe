import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_PROVIDERS } from "@/data";
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

      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter by provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Providers</SelectItem>
          {ALL_PROVIDERS.map((provider) => (
            <SelectItem key={provider} value={provider}>
              {provider}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterControls;
