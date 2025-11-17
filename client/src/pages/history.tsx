import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DateFilterSheet } from "@/components/DateFilterSheet";
import { MapPin, Clock, Edit2, Check, X, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Route } from "@shared/schema";
import mspLogo from "@assets/msp_logo_1762965721886.png";
import { format, startOfDay, endOfDay } from "date-fns";

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

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingNote, setEditingNote] = useState<{ checkInId: string; note: string } | null>(null);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [dateRange, setDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  });

  const startDate = format(dateRange.start, "yyyy-MM-dd");
  const endDate = format(dateRange.end, "yyyy-MM-dd");

  const handleFilterChange = (filter: string, start: Date, end: Date) => {
    setSelectedFilter(filter);
    setDateRange({ start, end });
  };

  const getFilterLabel = () => {
    const filterLabels: Record<string, string> = {
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      lastWeek: "Last Week",
      thisMonth: "This Month",
      lastMonth: "Last Month"
    };

    if (selectedFilter === "custom") {
      return format(dateRange.start, "MMM d, yyyy");
    }
    
    return filterLabels[selectedFilter] || "Select Date";
  };

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDistance = (miles: number | null) => {
    if (!miles) return "—";
    if (miles < 0.5) {
      return `${Math.round(miles * 5280)} ft`;
    }
    return `${miles.toFixed(1)} mi`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 pt-safe flex items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px]">
        <img 
          src={mspLogo} 
          alt="MSP Diesel Solutions" 
          className="h-8 w-auto flex-shrink-0"
        />
        
        {/* Date Filter Button */}
        <Button
          variant="outline"
          className="h-10 gap-2"
          onClick={() => setDateFilterOpen(true)}
          data-testid="button-date-filter"
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">{getFilterLabel()}</span>
        </Button>
      </header>

      {/* Date Filter Sheet */}
      <DateFilterSheet
        open={dateFilterOpen}
        onOpenChange={setDateFilterOpen}
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 pt-6">
        {/* Routes List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : routes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No routes found</h3>
              <p className="text-sm text-muted-foreground">
                Completed routes for {getFilterLabel().toLowerCase()} will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {routes.map((route) => {
              const completedStops = route.checkIns?.length || 0;
              const totalStops = completedStops;

              return (
                <AccordionItem
                  key={route.id}
                  value={route.id}
                  className="rounded-lg border bg-background overflow-hidden"
                  data-testid={`route-${route.id}`}
                >
                  <AccordionTrigger className="hover:no-underline px-4 py-3">
                    <div className="flex items-start justify-between w-full mr-2">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-base">
                            {format(new Date(route.createdAt), "MMM d, yyyy")}
                          </h3>
                          {route.status === "completed" && (
                            <Badge variant="success" className="text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {completedStops} stops
                          </span>
                          {route.totalDistanceMi && (
                            <span>{formatDistance(route.totalDistanceMi)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {route.checkIns?.map((checkIn, index) => (
                        <Card key={checkIn.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-3 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-success">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {checkIn.companyName}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="inline-block w-3 h-3 mr-1" />
                                  {formatTime(checkIn.timestamp)}
                                </p>
                                {checkIn.note ? (
                                  editingNote?.checkInId === checkIn.id ? (
                                    <div className="mt-2 space-y-2">
                                      <Textarea
                                        value={editingNote.note}
                                        onChange={(e) =>
                                          setEditingNote({
                                            ...editingNote,
                                            note: e.target.value,
                                          })
                                        }
                                        className="min-h-[60px] text-sm"
                                        placeholder="Add a note..."
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            updateNoteMutation.mutate({
                                              checkInId: checkIn.id,
                                              note: editingNote.note,
                                            })
                                          }
                                          disabled={updateNoteMutation.isPending}
                                          data-testid={`button-save-note-${checkIn.id}`}
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingNote(null)}
                                          data-testid={`button-cancel-note-${checkIn.id}`}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground mt-2 break-words">
                                      {checkIn.note}
                                    </p>
                                  )
                                ) : null}
                              </div>
                            </div>
                            {!editingNote || editingNote.checkInId !== checkIn.id ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  setEditingNote({
                                    checkInId: checkIn.id,
                                    note: checkIn.note || "",
                                  })
                                }
                                data-testid={`button-edit-note-${checkIn.id}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            ) : null}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}