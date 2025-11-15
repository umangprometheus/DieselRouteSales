import { useState, useEffect, useRef } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor,
  TouchSensor,
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableItem } from "./SortableItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, MapPin, Clock, Route as RouteIcon, GripVertical, X, Plus } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BuildRouteResponse } from "@shared/schema";

interface RouteReorderViewProps {
  open: boolean;
  onClose: () => void;
  route: BuildRouteResponse | null;
  onBuildRoute: (route: BuildRouteResponse) => void;
  onAddStops: () => void;
  onCancel: () => void;
  customEndpoint?: { label: string; lat: number; lng: number } | null;
}

export function RouteReorderView({
  open,
  onClose,
  route,
  onBuildRoute,
  onAddStops,
  onCancel,
  customEndpoint
}: RouteReorderViewProps) {
  const [editedStops, setEditedStops] = useState(route?.stops || []);
  const [isDirty, setIsDirty] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useBodyScrollLock(open);

  // Touch-friendly drag sensors
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (route) {
      setEditedStops(route.stops);
      setIsDirty(false);
    }
  }, [route]);

  // Manual scroll during drag for items near viewport edges
  useEffect(() => {
    if (!activeId || !scrollAreaRef.current) return;

    let animationFrameId: number;
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollContainer) return;

    const autoScroll = () => {
      const rect = scrollContainer.getBoundingClientRect();
      const mouseY = window.lastMouseY || 0;
      
      const edgeThreshold = 100;
      const scrollSpeed = 5;

      if (mouseY < rect.top + edgeThreshold) {
        scrollContainer.scrollTop -= scrollSpeed;
      } else if (mouseY > rect.bottom - edgeThreshold) {
        scrollContainer.scrollTop += scrollSpeed;
      }

      animationFrameId = requestAnimationFrame(autoScroll);
    };

    const trackMouse = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        window.lastMouseY = e.touches[0].clientY;
      } else {
        window.lastMouseY = e.clientY;
      }
    };

    document.addEventListener('mousemove', trackMouse);
    document.addEventListener('touchmove', trackMouse);
    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      document.removeEventListener('mousemove', trackMouse);
      document.removeEventListener('touchmove', trackMouse);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeId]);

  const getSortableId = (stop: any) => stop.routeStopId || stop.companyId;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = editedStops.findIndex(s => getSortableId(s) === active.id);
    const newIndex = editedStops.findIndex(s => getSortableId(s) === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(editedStops, oldIndex, newIndex);
      setEditedStops(reordered);
      setIsDirty(true);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const reordered = arrayMove(editedStops, index, index - 1);
    setEditedStops(reordered);
    setIsDirty(true);
  };

  const handleMoveDown = (index: number) => {
    const maxIndex = customEndpoint ? editedStops.length - 2 : editedStops.length - 1;
    if (index >= maxIndex) return;
    const reordered = arrayMove(editedStops, index, index + 1);
    setEditedStops(reordered);
    setIsDirty(true);
  };

  const handleBuildRoute = () => {
    if (!route) {
      return;
    }
    const updatedRoute = { ...route, stops: editedStops };
    // Call the handler and immediately close this view
    onBuildRoute(updatedRoute);
    onClose(); // Force close the reorder view
  };

  const handleCancel = () => {
    if (route) {
      setEditedStops(route.stops);
      setIsDirty(false);
    }
    onCancel();
  };

  if (!open || !route) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Edit Route</h2>
              <p className="text-xs text-muted-foreground">
                {editedStops.length} stop{editedStops.length !== 1 ? 's' : ''}
                {customEndpoint && ' + custom endpoint'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            data-testid="button-close-route-edit"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                <Clock className="h-3 w-3" />
                <span>Duration</span>
              </div>
              <div className="text-sm font-medium">{Math.round(route.totalEtaMin)} min</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                <Navigation className="h-3 w-3" />
                <span>Distance</span>
              </div>
              <div className="text-sm font-medium">{route.totalDistMi.toFixed(1)} mi</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                <MapPin className="h-3 w-3" />
                <span>Stops</span>
              </div>
              <div className="text-sm font-medium">{editedStops.length}</div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Content Area - Fixed Height with DnD Context */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
          autoScroll={false}
        >
          <ScrollArea ref={scrollAreaRef} className="h-full px-4">
            <SortableContext
              items={editedStops.map(s => getSortableId(s))}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 py-2">
                {editedStops.map((stop, index) => {
                  const isEndpoint = customEndpoint && index === editedStops.length - 1;
                  const stopId = getSortableId(stop);
                  return (
                    <SortableItem
                      key={stopId}
                      id={stopId}
                      disabled={!!isEndpoint}
                      stop={stop}
                      index={index}
                      isEndpoint={!!isEndpoint}
                      onMoveUp={() => handleMoveUp(index)}
                      onMoveDown={() => handleMoveDown(index)}
                      canMoveUp={index > 0 && !isEndpoint}
                      canMoveDown={index < (customEndpoint ? editedStops.length - 2 : editedStops.length - 1)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </ScrollArea>
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}
          >
            {activeId ? (
              <div className="bg-white border rounded-lg shadow-xl p-2 opacity-90">
                <GripVertical className="h-4 w-4" />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Footer - Outside all stacking contexts */}
      <div className="flex-shrink-0 border-t p-4 pb-20 bg-background">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            data-testid="button-cancel-route-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBuildRoute}
            className="flex-1"
            data-testid="button-build-route"
          >
            <RouteIcon className="h-4 w-4 mr-2" />
            Build Route
          </Button>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    lastMouseY?: number;
  }
}
