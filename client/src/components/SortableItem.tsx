import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, ChevronUp, ChevronDown, MapPin, Clock, Route, Flag } from "lucide-react";
import type { RouteStopApi } from "@shared/schema";

interface SortableItemProps {
  id: string;
  stop: RouteStopApi;
  index: number;
  disabled?: boolean;
  isEndpoint?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function SortableItem({
  id,
  stop,
  index,
  disabled,
  isEndpoint,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    disabled: disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDistance = (miles: number) => {
    return miles < 0.1 ? "< 0.1 mi" : `${miles.toFixed(1)} mi`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`${
          isDragging ? "opacity-50 shadow-lg scale-105" : ""
        } ${disabled ? "opacity-75" : ""} ${
          isEndpoint ? "border-primary bg-primary/5" : ""
        } ${!disabled ? "hover:shadow-md hover:border-primary/30 transition-all" : ""}`}
        data-testid={`stop-card-${index}`}
        style={{
          touchAction: 'pan-y',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          userSelect: 'none'
        }}
      >
        <CardContent className="px-2 py-3 sm:px-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag Handle - Only this activates drag */}
            {!disabled && (
              <button
                ref={setActivatorNodeRef}
                className="flex-shrink-0 p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 cursor-grab active:cursor-grabbing touch-none"
                data-testid={`drag-handle-${index}`}
                aria-label="Drag to reorder"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </button>
            )}

            {/* Stop Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  {/* Company name with stop number */}
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                    {isEndpoint ? (
                      <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    ) : (
                      <span className="text-base sm:text-lg font-bold text-primary flex-shrink-0">#{index + 1}</span>
                    )}
                    <p className="font-semibold text-sm sm:text-base truncate min-w-0">
                      {stop.name}
                    </p>
                  </div>
                  
                  {/* Address */}
                  {stop.street && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate min-w-0">
                      {stop.street}
                      {stop.city && `, ${stop.city}`}
                    </p>
                  )}
                  
                  {/* Metadata - distance and time */}
                  <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 flex-wrap min-w-0">
                    {stop.distanceFromPrevMi !== null && stop.distanceFromPrevMi > 0 && (
                      <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-muted-foreground">
                        <Route className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {formatDistance(stop.distanceFromPrevMi)}
                      </div>
                    )}
                    {stop.etaFromPrevMin !== null && stop.etaFromPrevMin > 0 && (
                      <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {formatTime(stop.etaFromPrevMin)}
                      </div>
                    )}
                    {isEndpoint && (
                      <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-primary font-medium">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Final destination
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Reorder Buttons - Mobile fallback */}
                {!disabled && (
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={onMoveUp}
                      disabled={!canMoveUp}
                      data-testid={`move-up-${index}`}
                    >
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={onMoveDown}
                      disabled={!canMoveDown}
                      data-testid={`move-down-${index}`}
                    >
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}