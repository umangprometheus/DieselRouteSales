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
import { Navigation, MapPin, Clock, Route as RouteIcon, GripVertical, ArrowLeft, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open - ONLY on mobile (< 768px)
  useEffect(() => {
    if (open && window.innerWidth < 768) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [open]);

  // Prevent pull-to-refresh during active drag by setting overscroll behavior
  // This does NOT block scrolling, just prevents the refresh gesture
  useEffect(() => {
    if (!activeId || !scrollAreaRef.current) return;

    const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollViewport) return;

    // Set overscroll behavior to prevent pull-to-refresh without blocking scroll
    scrollViewport.style.overscrollBehaviorY = 'contain';

    return () => {
      scrollViewport.style.overscrollBehaviorY = '';
    };
  }, [activeId]);

  // Touch-friendly drag sensors - handle-only activation with optimized timing
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Optimal delay for grip handle activation
        tolerance: 6, // Tight tolerance since only handle activates drag
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // Consistent with touch tolerance
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

  // Smoother auto-scroll during drag for items near viewport edges
  useEffect(() => {
    if (!activeId || !scrollAreaRef.current) return;

    let animationFrameId: number;
    let scrollDirection = 0; // -1 for up, 0 for none, 1 for down
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollContainer) return;

    const autoScroll = () => {
      if (scrollDirection !== 0) {
        const scrollSpeed = 8; // Increased for smoother scrolling
        scrollContainer.scrollTop += scrollDirection * scrollSpeed;
        animationFrameId = requestAnimationFrame(autoScroll);
      }
    };

    const updateScrollDirection = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = scrollContainer.getBoundingClientRect();
      const edgeThreshold = 100; // Larger threshold for easier triggering
      
      // Use viewport-relative positioning for more consistent behavior
      const viewportHeight = window.innerHeight;
      const distanceFromTop = clientY;
      const distanceFromBottom = viewportHeight - clientY;

      if (distanceFromTop < edgeThreshold && scrollContainer.scrollTop > 0) {
        // Near top edge - scroll up (only if there's content above)
        const intensity = 1 - (distanceFromTop / edgeThreshold);
        scrollDirection = -Math.max(0.5, intensity);
      } else if (distanceFromBottom < edgeThreshold && 
                 scrollContainer.scrollTop < scrollContainer.scrollHeight - scrollContainer.clientHeight) {
        // Near bottom edge - scroll down (only if there's content below)
        const intensity = 1 - (distanceFromBottom / edgeThreshold);
        scrollDirection = Math.max(0.5, intensity);
      } else {
        // Not near edges - stop scrolling
        scrollDirection = 0;
        cancelAnimationFrame(animationFrameId);
      }

      // Start scrolling if needed
      if (scrollDirection !== 0 && !animationFrameId) {
        animationFrameId = requestAnimationFrame(autoScroll);
      }
    };

    document.addEventListener('mousemove', updateScrollDirection);
    document.addEventListener('touchmove', updateScrollDirection, { passive: true });

    return () => {
      document.removeEventListener('mousemove', updateScrollDirection);
      document.removeEventListener('touchmove', updateScrollDirection);
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
    console.log('[RouteReorderView] handleBuildRoute clicked');
    if (!route) {
      console.log('[RouteReorderView] No route, returning');
      return;
    }
    const updatedRoute = { ...route, stops: editedStops };
    console.log('[RouteReorderView] Calling onBuildRoute');
    // Call the handler and immediately close this view
    onBuildRoute(updatedRoute);
    console.log('[RouteReorderView] Calling onClose');
    onClose(); // Force close the reorder view
    console.log('[RouteReorderView] Both handlers called');
  };

  const handleCancel = () => {
    if (route) {
      setEditedStops(route.stops);
      setIsDirty(false);
    }
    onCancel();
  };

  const handleClose = () => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      handleCancel();
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    handleCancel();
  };

  if (!open || !route) return null;

  return (
    <>
      {/* Desktop overlay backdrop - pointer-events-none to allow navigation clicks */}
      <div 
        className="hidden md:block fixed inset-0 z-[190] bg-black/30 pointer-events-none"
      />

      {/* Main container - Full screen on mobile, modal on desktop */}
      <div 
        className="fixed inset-0 z-[200] bg-background flex flex-col pointer-events-auto md:inset-auto md:top-16 md:bottom-24 md:left-1/2 md:-translate-x-1/2 md:rounded-lg md:shadow-2xl md:w-[90vw] md:max-w-2xl md:pointer-events-auto"
      >
      {/* Header */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleClose}
            data-testid="button-back-from-reorder"
            className="flex-shrink-0 md:hidden"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Edit Route</h2>
            <p className="text-xs text-muted-foreground">
              {editedStops.length} stop{editedStops.length !== 1 ? 's' : ''}
              {customEndpoint && ' + custom endpoint'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            data-testid="button-close-reorder"
            className="hidden md:flex flex-shrink-0"
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

      {/* Content Area - Constrained height to not overlap footer */}
      <div className="flex-1 overflow-hidden pb-32" style={{ pointerEvents: 'auto' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
          autoScroll={false}
        >
          <div className="h-full overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full px-4">
              <SortableContext
                items={editedStops.map(s => getSortableId(s))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 py-2 pb-24">
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
          </div>
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
            {activeId ? (() => {
              const activeStop = editedStops.find(s => getSortableId(s) === activeId);
              if (!activeStop) return null;
              const index = editedStops.findIndex(s => getSortableId(s) === activeId);
              return (
                <div className="bg-background border-2 border-primary rounded-lg shadow-2xl p-3 opacity-95">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <h3 className="font-medium text-sm truncate">{activeStop.name}</h3>
                      </div>
                      {activeStop.customerNumber && (
                        <p className="text-xs text-muted-foreground">#{activeStop.customerNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Footer - Absolutely positioned to ensure it's above everything */}
      <div className="absolute bottom-0 left-0 right-0 border-t p-6 pb-20 bg-background space-y-3" style={{ zIndex: 10000 }}>
        <button
          type="button"
          onClick={handleBuildRoute}
          disabled={editedStops.length === 0}
          className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 min-h-10 px-4 py-2"
          data-testid="button-build-route"
        >
          <RouteIcon className="h-5 w-5 mr-2" />
          Build Route
        </button>
      </div>
      </div>

      {/* Unsaved changes confirmation dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your route order. If you close now, your edits will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-keep-editing">Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose} data-testid="button-discard-changes">
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

declare global {
  interface Window {
    lastMouseY?: number;
  }
}
