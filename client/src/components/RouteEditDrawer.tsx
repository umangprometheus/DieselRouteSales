import { useState, useEffect } from "react";
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
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableItem } from "./SortableItem";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MapIcon, List, Navigation, MapPin, Clock, Route as RouteIcon, GripVertical } from "lucide-react";
import MapView from "./map-view";
import type { BuildRouteResponse } from "@shared/schema";

interface RouteEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: BuildRouteResponse | null;
  onConfirm: (route: BuildRouteResponse) => void;
  onCancel: () => void;
  customEndpoint?: { label: string; lat: number; lng: number } | null;
}

export function RouteEditDrawer({
  open,
  onOpenChange,
  route,
  onConfirm,
  onCancel,
  customEndpoint
}: RouteEditDrawerProps) {
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [editedStops, setEditedStops] = useState(route?.stops || []);
  const [isDirty, setIsDirty] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Touch-friendly drag sensors with long-press activation for mobile
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long-press delay for mobile
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

  // Initialize stops when route changes
  useEffect(() => {
    if (route) {
      setEditedStops(route.stops);
      setIsDirty(false);
    }
  }, [route]);

  // Prevent viewport scrolling during drag operations
  useEffect(() => {
    if (!activeId) return;

    // Save current scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Save original styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Lock viewport
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollTop}px`;
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';

    // Prevent all touch scrolling with non-passive listener
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventScroll, { passive: false });

    // Cleanup function
    return () => {
      // Restore viewport
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.documentElement.style.overflow = originalHtmlOverflow;

      // Restore scroll position
      window.scrollTo(0, scrollTop);

      // Remove event listener
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [activeId]);

  // Get sortable ID for each stop
  const getSortableId = (stop: any) => stop.routeStopId || stop.companyId;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (active.id !== over?.id) {
      setEditedStops((items) => {
        const oldIndex = items.findIndex((item) => getSortableId(item) === active.id);
        const newIndex = items.findIndex((item) => getSortableId(item) === over?.id);
        
        // Don't allow moving the custom endpoint (if it's the last stop)
        if (customEndpoint && oldIndex === items.length - 1) {
          return items;
        }
        
        setIsDirty(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0 && !(customEndpoint && index === editedStops.length - 1)) {
      setEditedStops(arrayMove(editedStops, index, index - 1));
      setIsDirty(true);
    }
  };

  const handleMoveDown = (index: number) => {
    const maxIndex = customEndpoint ? editedStops.length - 2 : editedStops.length - 1;
    if (index < maxIndex) {
      setEditedStops(arrayMove(editedStops, index, index + 1));
      setIsDirty(true);
    }
  };

  const handleConfirm = async () => {
    if (route) {
      try {
        // Extract company IDs in the edited order
        const orderedStopIds = editedStops.map((stop) => 
          stop.companyId || getSortableId(stop) // Use companyId or fallback to ID getter
        );

        // Call backend to recalculate route with new order
        const response = await fetch(`/api/routes/${route.routeId}/stops`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderedStopIds,
            customEndpoint,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update route');
        }

        const updatedRoute: BuildRouteResponse = await response.json();
        
        // Pass the recalculated route from backend
        onConfirm(updatedRoute);
      } catch (error) {
        console.error('Error updating route:', error);
        // Fallback to local update if API fails
        const updatedRoute: BuildRouteResponse = {
          ...route,
          stops: editedStops,
        };
        onConfirm(updatedRoute);
      }
    }
  };

  const handleCancel = () => {
    setEditedStops(route?.stops || []);
    setIsDirty(false);
    onCancel();
  };

  if (!route) return null;

  const totalDistance = route.totalDistMi.toFixed(1);
  const totalTime = Math.round(route.totalEtaMin);
  const stopCount = editedStops.length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[100vh] max-h-[100vh] flex flex-col">
        {/* Sticky Header */}
        <DrawerHeader className="pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Edit Your Route</DrawerTitle>
              <DrawerDescription className="text-xs mt-1">
                Drag stops to reorder • {stopCount} stops • {totalDistance} mi • {totalTime} min
              </DrawerDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={!isDirty}
                data-testid="button-confirm-route"
              >
                Confirm Route
              </Button>
            </div>
          </div>
        </DrawerHeader>

        {/* View Toggle */}
        <div className="px-4 py-2 border-b flex-shrink-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "map")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="text-xs gap-1">
                <List className="h-3 w-3" />
                List View
              </TabsTrigger>
              <TabsTrigger value="map" className="text-xs gap-1">
                <MapIcon className="h-3 w-3" />
                Map View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {activeTab === "list" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            >
              <SortableContext
                items={editedStops.map(s => getSortableId(s))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {editedStops.map((stop, index) => {
                    const isEndpoint = customEndpoint && index === editedStops.length - 1;
                    const stopId = getSortableId(stop);
                    return (
                      <SortableItem
                        key={stopId}
                        id={stopId}
                        disabled={isEndpoint}
                        stop={stop}
                        index={index}
                        isEndpoint={isEndpoint}
                        onMoveUp={() => handleMoveUp(index)}
                        onMoveDown={() => handleMoveDown(index)}
                        canMoveUp={index > 0 && !isEndpoint}
                        canMoveDown={index < (customEndpoint ? editedStops.length - 2 : editedStops.length - 1)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
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
          ) : (
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <MapView
                companies={editedStops.map((stop) => ({
                  id: getSortableId(stop),
                  name: stop.name,
                  street: stop.street,
                  city: stop.city,
                  state: stop.state,
                  postalCode: stop.postalCode,
                  country: null,
                  lat: stop.lat,
                  lng: stop.lng,
                  ownerId: null,
                  hubspotId: null,
                  hubspotUrl: null,
                  lastUpdated: null,
                  deleted: false,
                  distanceMi: stop.distanceFromPrevMi || 0,
                }))}
                selectedCompanyIds={[]}
                userLocation={route.stops[0] ? { lat: route.stops[0].lat, lng: route.stops[0].lng } : null}
                routeGeometry={route.routeGeometry}
              />
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <DrawerFooter className="border-t pt-3 pb-safe flex-shrink-0">
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={!isDirty}
            data-testid="button-navigate"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isDirty ? "Confirm Changes & Navigate" : "Start Navigation"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {isDirty ? "Tap Confirm to save your changes" : "Reorder stops above or tap to navigate"}
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}