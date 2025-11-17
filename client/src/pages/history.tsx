import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, MapPin, Clock, Edit2, Check, X, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Route } from "@shared/schema";
import mspLogo from "@assets/msp_logo_1762965721886.png";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";

interface RouteWithDetails extends Route {
  checkIns?: Array<{
    id: string;
    companyId: string;
    companyName: string;
    lat: number;
    lng: number;
    note: string | null;
    timestamp: string;
  }>;
}

type DateFilter = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "custom";

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingNote, setEditingNote] = useState<{ checkInId: string; note: string } | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDate, setCustomDate] = useState<Date>(new Date());

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    
    switch (dateFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "this-week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "last-week":
        const lastWeek = subWeeks(now, 1);
        return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
      case "this-month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last-month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "custom":
        return { start: startOfDay(customDate), end: endOfDay(customDate) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const { start, end } = getDateRange();
  const startDate = format(start, "yyyy-MM-dd");
  const endDate = format(end, "yyyy-MM-dd");

  const { data, isLoading } = useQuery<{ routes: RouteWithDetails[] }>({
    queryKey: ["/api/routes/history", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/routes/history?status=completed&startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error("Failed to fetch route history");
      return response.json();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ checkInId, note }: { checkInId: string; note: string }) => {
      return apiRequest("PATCH", `/api/checkins/${checkInId}`, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes/history"] });
      setEditingNote(null);
      toast({
        title: "Note updated",
        description: "Check-in note has been saved",
      });
    },
  });

  const routes = data?.routes || [];

  const filterButtons: { label: string; value: DateFilter }[] = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "this-week" },
    { label: "Last Week", value: "last-week" },
    { label: "This Month", value: "this-month" },
    { label: "Last Month", value: "last-month" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 pt-safe px-4 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px]">
        <img 
          src={mspLogo} 
          alt="MSP Diesel Solutions" 
          className="h-8 w-auto"
        />
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Date Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {filterButtons.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={dateFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter(filter.value)}
                    data-testid={`button-filter-${filter.value}`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Picker */}
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateFilter === "custom" ? "default" : "outline"}
                      className="flex-1 justify-start text-left font-normal min-h-[44px]"
                      onClick={() => setDateFilter("custom")}
                      data-testid="button-custom-date"
                    >
                      {dateFilter === "custom" ? format(customDate, "MMMM dd, yyyy") : "Custom Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomDate(date);
                          setDateFilter("custom");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routes List */}
        <div>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading routes...</p>
        ) : routes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No completed routes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your completed routes will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {routes.map((route) => {
              const stops = route.stops as any[];
              const completedStops = stops.filter((s) => s.completed);
              const routeDate = new Date(route.createdAt);

              return (
                <AccordionItem key={route.id} value={route.id} className="border rounded-lg bg-card">
                  <AccordionTrigger className="px-4 hover:no-underline" data-testid={`accordion-route-${route.id}`}>
                    <div className="flex items-start justify-between gap-3 w-full pr-4">
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-foreground">
                          {routeDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {routeDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="shrink-0">
                          {completedStops.length}/{stops.length} stops
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3 pt-2">
                      {stops.map((stop, idx) => {
                        // Find corresponding check-in for this stop
                        const checkIn = route.checkIns?.find(
                          (ci) => ci.companyId === stop.companyId
                        );

                        return (
                          <div
                            key={stop.companyId}
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              stop.completed
                                ? "bg-success/10 border border-success/20"
                                : "bg-muted/50"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground">{stop.name}</h4>
                              {(stop.street || stop.city) && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {[stop.street, stop.city, stop.state]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                              {stop.completed && checkIn && (
                                <div className="mt-2 space-y-2">
                                  <Badge variant="default">
                                    <Check className="w-3 h-3 mr-1" />
                                    Visited
                                  </Badge>
                                  {checkIn.note && (
                                    <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-2 mt-2">
                                      "{checkIn.note}"
                                    </p>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setEditingNote({
                                        checkInId: checkIn.id,
                                        note: checkIn.note || "",
                                      })
                                    }
                                    className="h-9 text-xs"
                                    data-testid={`button-edit-note-${idx}`}
                                  >
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    {checkIn.note ? "Edit Note" : "Add Note"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Route Stats
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Distance:</span>{" "}
                            <span className="font-semibold">
                              {route.totalDistanceMi.toFixed(1)} mi
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Est. Time:</span>{" "}
                            <span className="font-semibold">{route.totalEtaMin} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
        </div>
      </div>

      {/* Edit Note Dialog */}
      {editingNote && (
        <Dialog open={true} onOpenChange={() => setEditingNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Check-In Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Textarea
                value={editingNote.note}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, note: e.target.value })
                }
                placeholder="Add notes about this visit..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNote(null)} className="min-h-[44px]">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    updateNoteMutation.mutate({
                      checkInId: editingNote.checkInId,
                      note: editingNote.note,
                    })
                  }
                  disabled={updateNoteMutation.isPending}
                  className="min-h-[44px]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
