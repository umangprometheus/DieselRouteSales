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
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {/* Drag Handle - Only this activates drag */}
            {!disabled && (
              <button
                ref={setActivatorNodeRef}
                className="flex-shrink-0 p-1 -ml-1 cursor-grab active:cursor-grabbing touch-none"
                data-testid={`drag-handle-${index}`}
                aria-label="Drag to reorder"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-primary" />
              </button>
            )}

            {/* Stop Number */}
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              isEndpoint ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
            }`}>
              {isEndpoint ? <Flag className="h-3 w-3" /> : index + 1}
            </div>

            {/* Stop Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-medium text-sm truncate">
                    {stop.name}
                  </p>
                  {stop.street && (
                    <p className="text-xs text-muted-foreground truncate">
                      {stop.street}
                      {stop.city && `, ${stop.city}`}
                    </p>
                  )}
                </div>
                
                {/* Reorder Buttons - Mobile fallback */}
                {!disabled && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={onMoveUp}
                      disabled={!canMoveUp}
                      data-testid={`move-up-${index}`}
                    >
                      <ChevronUp className="h-3 w-3 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={onMoveDown}
                      disabled={!canMoveDown}
                      data-testid={`move-down-${index}`}
                    >
                      <ChevronDown className="h-3 w-3 text-primary" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Stop Metadata */}
              <div className="flex items-center gap-3 mt-1">
                {stop.distanceFromPrevMi !== null && stop.distanceFromPrevMi > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Route className="h-3 w-3" />
                    {formatDistance(stop.distanceFromPrevMi)}
                  </div>
                )}
                {stop.etaFromPrevMin !== null && stop.etaFromPrevMin > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(stop.etaFromPrevMin)}
                  </div>
                )}
                {isEndpoint && (
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    <MapPin className="h-3 w-3" />
                    Final destination
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