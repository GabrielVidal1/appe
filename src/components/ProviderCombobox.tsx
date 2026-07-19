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
import { cn } from "@/lib/utils";
import { ALL_PROVIDERS } from "@appe/core";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { ProviderIcon } from "./ProviderIcons";

// The models.dev catalogue lists ~50 providers — far too many for a plain
// dropdown. This is a searchable combobox (cmdk fuzzy match) that only ever
// renders a handful of rows at once, so the list stays scannable no matter how
// many providers the daily sync introduces.
const MAX_VISIBLE = 5;

// The sentinel value used to represent "no provider filter".
export const ALL_PROVIDERS_VALUE = "all";

interface ProviderComboboxProps {
  /** Currently selected provider id, or "all" for no filter. */
  value: string;
  onChange: (value: string) => void;
  /** Optional list of provider ids to choose from (defaults to every provider
   *  in the synced catalogue). */
  providers?: string[];
  className?: string;
  placeholder?: string;
}

const ProviderCombobox = ({
  value,
  onChange,
  providers = ALL_PROVIDERS,
  className,
  placeholder = "Filter by provider",
}: ProviderComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Fuzzy-ish substring match on the query, then cap at MAX_VISIBLE so the
  // popover never grows unwieldy — the search box is how you reach the rest.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? providers.filter((p) => p.toLowerCase().includes(q))
      : providers;
    return matches.slice(0, MAX_VISIBLE);
  }, [providers, query]);

  const hiddenCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    const total = q
      ? providers.filter((p) => p.toLowerCase().includes(q)).length
      : providers.length;
    return Math.max(0, total - shown.length);
  }, [providers, query, shown.length]);

  const isAll = value === ALL_PROVIDERS_VALUE;

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={cn("w-full justify-between sm:w-48", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            {!isAll && <ProviderIcon provider={value} className="h-4 w-4" />}
            <span className="truncate">{isAll ? "All Providers" : value}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {/* shouldFilter=false: we do our own substring match + MAX_VISIBLE cap
            above, so cmdk shouldn't also filter/hide our already-capped rows. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search providers…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No provider found.</CommandEmpty>
            <CommandGroup>
              {/* "All Providers" is only offered when not actively searching. */}
              {!query.trim() && (
                <CommandItem
                  value={ALL_PROVIDERS_VALUE}
                  onSelect={() => select(ALL_PROVIDERS_VALUE)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isAll ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Providers
                </CommandItem>
              )}
              {shown.map((provider) => (
                <CommandItem
                  key={provider}
                  value={provider}
                  onSelect={() => select(provider)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === provider ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <ProviderIcon provider={provider} className="mr-2 h-4 w-4" />
                  <span className="truncate">{provider}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {hiddenCount > 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                +{hiddenCount} more — type to search
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProviderCombobox;
