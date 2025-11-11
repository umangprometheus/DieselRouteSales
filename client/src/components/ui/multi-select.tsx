import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  className,
  allowOther = false,
  otherValue = "",
  onOtherChange,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  
  // Check if "Other" is selected
  const hasOther = selected.includes("other");
  
  // Add "Other" option to the list if allowOther is true
  const optionsWithOther = React.useMemo(() => {
    if (!allowOther) return options;
    return [...options, { value: "other", label: "Other" }];
  }, [options, allowOther]);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
    // Clear other text if "Other" is removed
    if (value === "other" && onOtherChange) {
      onOtherChange("");
    }
  };

  const selectedLabels = selected.map(
    (value) => {
      if (value === "other" && otherValue) {
        return `Other: ${otherValue}`;
      }
      return optionsWithOther.find((option) => option.value === value)?.label || value;
    }
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-10 h-auto",
              selected.length > 0 ? "py-2" : "",
              className
            )}
          >
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedLabels.map((label, index) => (
                  <Badge
                    key={selected[index]}
                    variant="secondary"
                    className="mr-1"
                    onClick={(e) => handleRemove(selected[index], e)}
                  >
                    {label}
                    <X className="ml-1 h-3 w-3 hover:text-destructive-foreground" />
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {optionsWithOther.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Show text input when "Other" is selected */}
      {allowOther && hasOther && (
        <Input
          type="text"
          placeholder="Please specify..."
          value={otherValue}
          onChange={(e) => onOtherChange?.(e.target.value)}
          className="w-full"
        />
      )}
    </div>
  );
}