import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, Circle, Navigation, Clock, Search, X } from "lucide-react";
import type { RouteStopApi } from "@shared/schema";

interface RoutePanelProps {
  stops: RouteStopApi[];
  currentStopIndex: number;
  totalDistanceMi: number;
  totalEtaMin: number;
  onNavigate: (stop: RouteStopApi) => void;
  className?: string;
  testMode?: boolean;
  onSimulateLocation?: (stopIndex: number) => void;
}

export default function RoutePanel({
  stops,
  currentStopIndex,
  totalDistanceMi,
  totalEtaMin,
  onNavigate,
  className = "",
  testMode = false,
  onSimulateLocation,
}: RoutePanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStops = stops.filter((stop) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      stop.name.toLowerCase().includes(query) ||
      stop.street?.toLowerCase().includes(query) ||
      stop.city?.toLowerCase().includes(query) ||
      stop.state?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Route Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Distance</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-distance">
              {totalDistanceMi.toFixed(1)} mi
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Est. Time</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-eta">
              {Math.round(totalEtaMin)} min
            </p>
          </div>
        </div>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search stops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
          data-testid="input-search-stops"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stops List */}
      <div className="space-y-3">
        {filteredStops.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No stops match your search</p>
            </div>
          </Card>
        ) : (
          filteredStops.map((stop) => {
            const originalIndex = stops.indexOf(stop);
            const isCurrent = originalIndex === currentStopIndex;
            const isCompleted = stop.completed;
            const isPast = originalIndex < currentStopIndex;

            return (
              <Card
                key={stop.companyId}
                className={`p-4 transition-all ${
                  isCurrent ? "ring-2 ring-warning shadow-md" : ""
                } ${isPast || isCompleted ? "opacity-60" : ""}`}
                data-testid={`card-route-stop-${originalIndex}`}
              >
                <div className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div className="flex-shrink-0 pt-1">
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center text-warning-foreground font-semibold text-sm">
                        {originalIndex + 1}
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Stop details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {stop.name}
                      </h3>
                      {isCurrent && (
                        <Badge variant="default" className="bg-warning text-warning-foreground">
                          Current
                        </Badge>
                      )}
                    </div>

                    {stop.etaFromPrevMin !== null && stop.etaFromPrevMin > 0 && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{Math.round(stop.etaFromPrevMin)} min</span>
                        </div>
                        {stop.distanceFromPrevMi !== null && (
                          <span>• {stop.distanceFromPrevMi.toFixed(1)} mi from previous</span>
                        )}
                      </div>
                    )}

                    {isCurrent && !isCompleted && (
                      <Button
                        onClick={() => onNavigate(stop)}
                        variant="outline"
                        className="w-full mt-2 h-11"
                        data-testid={`button-navigate-${originalIndex}`}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Navigate to {stop.name}
                      </Button>
                    )}
                    
                    {/* Test Mode: Simulate being at this stop */}
                    {testMode && !isCompleted && !isCurrent && onSimulateLocation && (
                      <Button
                        onClick={() => onSimulateLocation(originalIndex)}
                        variant="secondary"
                        className="w-full mt-2 h-11"
                        data-testid={`button-simulate-${originalIndex}`}
                      >
                        📍 Test: Go Here
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connecting line (not for last stop) */}
                {originalIndex < stops.length - 1 && (
                  <div className="ml-3 mt-2 mb-2 h-6 w-0.5 bg-border" />
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
