import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_TAGS } from "@/data";
import { Filter } from "lucide-react";

interface TagFilterProps {
  tags: string[] | null;
  setTags: (updater: (prev: string[] | null) => string[] | null) => void;
}

const TagFilter = ({ tags, setTags }: TagFilterProps) => {
  const handleTagToggle = (tag: string, exclude: boolean) => {
    setTags((prev) => {
      const currentTags = prev ?? [];
      return exclude
        ? [...currentTags, tag]
        : currentTags.filter((t) => t !== tag);
    });
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
          {ALL_TAGS.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag}`}
                checked={tags === null || tags?.includes(tag)}
                onCheckedChange={(checked) => handleTagToggle(tag, !!checked)}
              />
              <Label htmlFor={`tag-${tag}`} className="text-sm">
                {tag}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TagFilter;
