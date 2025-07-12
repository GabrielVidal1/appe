import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_TAGS, CAPABILITIES_FROM_TAG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

const ModelCapabilities = () => {
  const [open, setOpen] = useState(false);
  const { watch, setValue } = useFormContext();
  const selectedCapabilities = watch("modelCapabilities") || [];

  const showColumns = watch("showColumns");

  const handleSelect = (currentValue: string) => {
    const newCapabilities = selectedCapabilities.includes(currentValue)
      ? selectedCapabilities.filter(
          (capability: string) => capability !== currentValue
        )
      : [...selectedCapabilities, currentValue];

    setValue("modelCapabilities", newCapabilities);
  };

  const displayText =
    selectedCapabilities.length > 0
      ? selectedCapabilities
          .map((capability) => CAPABILITIES_FROM_TAG[capability] || capability)
          .join(", ")
      : "do anything";

  useEffect(() => {
    setValue("showColumns", {
      ...showColumns,
      tags: selectedCapabilities.length > 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCapabilities]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="underline text-xl font-medium p-0 h-auto border-none shadow-none hover:bg-transparent"
        >
          {displayText}
          {/* <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search capabilities..." />
          <CommandList>
            <CommandEmpty>No capability found.</CommandEmpty>
            <CommandGroup>
              {ALL_TAGS.map((tag) => (
                <CommandItem
                  key={tag}
                  value={tag}
                  onSelect={() => handleSelect(tag)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCapabilities.includes(tag)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {tag}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ModelCapabilities;
