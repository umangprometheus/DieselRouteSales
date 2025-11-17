import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, MapPin, Clock, CalendarIcon, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import mspLogo from "@assets/msp_logo_1762965721886.png";

export default function SummaryPage() {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateString = format(selectedDate, "yyyy-MM-dd");
  
  const { data: summary, isLoading } = useSummary(dateString);
  const { logout } = useAuth();

  const handleExport = () => {
    if (!summary) return;

    const csv = [
      ["Company", "Time", "GPS", "Notes"],
      ...summary.checkIns.map((c) => [
        c.companyName,
        new Date(c.timestamp).toLocaleString(),
        `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`,
        c.note || "—",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `field-visits-${dateString}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 pt-safe px-4 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px]">
        <img 
          src={mspLogo} 
          alt="MSP Diesel Solutions" 
          className="h-8 w-auto"
        />
        <Button 
          variant="outline" 
          className="h-10"
          onClick={handleExport}
          disabled={!summary || summary.checkIns.length === 0}
          data-testid="button-export"
        >
          <Download className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Date Picker */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal min-h-[44px]">
                    {format(selectedDate, "MMMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Stops Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground" data-testid="text-visit-count">
                  {summary.visitCount}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-distance">
                  {summary.totalDistanceMi} mi
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Check-Ins Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Visit Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !summary || summary.checkIns.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No visits recorded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check-ins for this date will appear here
                </p>
              </div>
            ) : (
              summary.checkIns.map((checkIn, index) => {
                const time = new Date(checkIn.timestamp).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div key={checkIn.id} className="relative">
                    <div className="flex gap-4">
                      {/* Timeline dot and line */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-success" />
                        </div>
                        {index < summary.checkIns.length - 1 && (
                          <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {checkIn.companyName}
                          </h3>
                          <Badge variant="secondary" className="flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {time}
                          </Badge>
                        </div>
                        
                        {checkIn.note && (
                          <p className="text-sm text-muted-foreground mt-2">{checkIn.note}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs font-mono text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{checkIn.lat.toFixed(6)}, {checkIn.lng.toFixed(6)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="flex justify-center pb-4">
          <Button
            variant="destructive"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
