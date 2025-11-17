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
        className="h-auto max-h-[85vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Select Date Range</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Quick Filters */}
          <div className="space-y-2">
            <RadioGroup 
              value={tempFilter === "custom" ? "" : tempFilter} 
              onValueChange={handleQuickFilterChange}
            >
              {filterOptions.map((option) => (
                <Label
                  key={option.id}
                  htmlFor={option.id}
                  className="flex items-center justify-between p-4 min-h-[48px] rounded-lg border bg-background cursor-pointer hover-elevate active-elevate-2"
                  data-testid={`filter-${option.id}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <div>
                      <div className="font-medium text-base">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.subtitle}</div>
                    </div>
                  </div>
                  {selectedFilter === option.id && (
                    <Check className="h-4 w-4 text-success" />
                  )}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Date Option */}
          <div>
            <Button
              variant={showCustomPicker ? "default" : "outline"}
              className="w-full h-12 justify-start text-left"
              onClick={handleCustomClick}
              data-testid="button-custom-date"
            >
              <CalendarIcon className="mr-3 h-4 w-4" />
              <span className="flex-1">
                {customDate && tempFilter === "custom" 
                  ? format(customDate, "MMMM d, yyyy")
                  : "Select Custom Date"
                }
              </span>
              {selectedFilter === "custom" && customDate && (
                <Check className="h-4 w-4 text-success ml-2" />
              )}
            </Button>

            {/* Custom Date Picker */}
            {showCustomPicker && (
              <div className="mt-4 flex justify-center">
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="flex-1 h-12"
              onClick={handleApply}
              data-testid="button-apply"
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}