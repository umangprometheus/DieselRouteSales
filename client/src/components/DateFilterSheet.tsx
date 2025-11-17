import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

interface DateFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFilter: string;
  onFilterChange: (filter: string, startDate: Date, endDate: Date) => void;
}

const filterOptions = [
  { 
    id: "today", 
    label: "Today",
    subtitle: format(new Date(), "MMM d, yyyy"),
    getRange: () => {
      const today = new Date();
      return { start: startOfDay(today), end: endOfDay(today) };
    }
  },
  { 
    id: "yesterday", 
    label: "Yesterday",
    subtitle: format(subDays(new Date(), 1), "MMM d, yyyy"),
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
  },
  { 
    id: "thisWeek", 
    label: "This Week",
    subtitle: `${format(startOfWeek(new Date(), { weekStartsOn: 0 }), "MMM d")} - ${format(endOfWeek(new Date(), { weekStartsOn: 0 }), "MMM d")}`,
    getRange: () => {
      const now = new Date();
      return { 
        start: startOfWeek(now, { weekStartsOn: 0 }), 
        end: endOfWeek(now, { weekStartsOn: 0 }) 
      };
    }
  },
  { 
    id: "lastWeek", 
    label: "Last Week",
    subtitle: `${format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }), "MMM d")} - ${format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }), "MMM d")}`,
    getRange: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return { 
        start: startOfWeek(lastWeek, { weekStartsOn: 0 }), 
        end: endOfWeek(lastWeek, { weekStartsOn: 0 }) 
      };
    }
  },
  { 
    id: "thisMonth", 
    label: "This Month",
    subtitle: format(new Date(), "MMMM yyyy"),
    getRange: () => {
      const now = new Date();
      return { 
        start: startOfMonth(now), 
        end: endOfMonth(now) 
      };
    }
  },
  { 
    id: "lastMonth", 
    label: "Last Month",
    subtitle: format(subMonths(new Date(), 1), "MMMM yyyy"),
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { 
        start: startOfMonth(lastMonth), 
        end: endOfMonth(lastMonth) 
      };
    }
  }
];

export function DateFilterSheet({ 
  open, 
  onOpenChange, 
  selectedFilter, 
  onFilterChange 
}: DateFilterSheetProps) {
  const [tempFilter, setTempFilter] = useState(selectedFilter);
  const [customDate, setCustomDate] = useState<Date | undefined>(
    selectedFilter === "custom" ? new Date() : undefined
  );
  const [showCustomPicker, setShowCustomPicker] = useState(selectedFilter === "custom");

  const handleApply = () => {
    if (tempFilter === "custom" && customDate) {
      onFilterChange(
        "custom",
        startOfDay(customDate),
        endOfDay(customDate)
      );
    } else {
      const option = filterOptions.find(opt => opt.id === tempFilter);
      if (option) {
        const range = option.getRange();
        onFilterChange(tempFilter, range.start, range.end);
      }
    }
    onOpenChange(false);
  };

  const handleQuickFilterChange = (value: string) => {
    setTempFilter(value);
    setShowCustomPicker(false);
  };

  const handleCustomClick = () => {
    setTempFilter("custom");
    setShowCustomPicker(true);
    if (!customDate) {
      setCustomDate(new Date());
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="flex h-[85vh] flex-col overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Select Date Range</SheetTitle>
        </SheetHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
          {/* Quick Filters */}
          <div className="space-y-1">
            <RadioGroup 
              value={tempFilter === "custom" ? "" : tempFilter} 
              onValueChange={handleQuickFilterChange}
            >
              {filterOptions.map((option) => (
                <Label
                  key={option.id}
                  htmlFor={option.id}
                  className="flex items-center py-2.5 px-3 rounded-lg border bg-background cursor-pointer hover-elevate active-elevate-2"
                  data-testid={`filter-${option.id}`}
                >
                  <RadioGroupItem value={option.id} id={option.id} className="flex-shrink-0" />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.subtitle}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Date Option */}
          <div className="mt-3">
            <Button
              variant={showCustomPicker ? "default" : "outline"}
              className="w-full h-11 justify-start text-left"
              onClick={handleCustomClick}
              data-testid="button-custom-date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="flex-1 text-sm">
                {customDate && tempFilter === "custom" 
                  ? format(customDate, "MMMM d, yyyy")
                  : "Select Custom Date"
                }
              </span>
            </Button>

            {/* Custom Date Picker */}
            {showCustomPicker && (
              <div className="mt-3 flex justify-center">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={(date) => {
                    if (date) {
                      setCustomDate(date);
                      setTempFilter("custom");
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  className="rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Buttons */}
        <div className="flex-shrink-0 flex gap-3 pt-4 mt-auto border-t bg-background">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1 h-11"
            onClick={handleApply}
            data-testid="button-apply"
          >
            Apply Filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}