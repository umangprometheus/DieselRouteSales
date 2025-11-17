import { useState } from "react";
import { useLocation } from "wouter";
import { useSavedRoutes, useBuildFromSaved, useDeleteSavedRoute, useUpdateSavedRoute } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Route, Trash2, Edit, Loader2, Map, Calendar, Navigation } from "lucide-react";
import mspLogo from "@assets/msp_logo_1762965721886.png";

export default function SavedPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState("");

  // Fetch saved routes with stops included
  const { data, isLoading } = useSavedRoutes(true);
  const buildFromSavedMutation = useBuildFromSaved();
  const deleteRouteMutation = useDeleteSavedRoute();
  const updateRouteMutation = useUpdateSavedRoute();

  const savedRoutes = data?.routes || [];

  const handleBuildRoute = async (routeId: string, routeName: string) => {
    try {
      const result = await buildFromSavedMutation.mutateAsync(routeId);
      
      // Convert the response to the format expected by the route page
      const routeData = {
        routeId: result.id,
        stops: result.stops || [],
        totalDistMi: result.totalDistanceMi,
        totalEtaMin: result.totalEtaMin,
        navUrl: `https://www.google.com/maps/dir/?api=1&waypoints=${(result.stops || []).map((s: any) => `${s.lat},${s.lng}`).join('|')}&travelmode=driving`,
        routeGeometry: result.routeGeometry || (result.stops || []).map((s: any) => ({ lat: s.lat, lng: s.lng })),
      };
      
      // Store the active route in localStorage
      localStorage.setItem("activeRoute", JSON.stringify(routeData));
      
      toast({
        title: "Route activated!",
        description: `"${routeName}" is now your active route.`,
        duration: 1000,
      });
      
      // Navigate to the route page after a brief delay to ensure localStorage is saved
      setTimeout(() => {
        navigate("/route");
      }, 200);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to activate route",
        description: error?.message || "Unable to build route from saved template.",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    
    try {
      await deleteRouteMutation.mutateAsync(selectedRoute.id);
      toast({
        title: "Route deleted",
        description: `"${selectedRoute.templateName}" has been removed.`,
        duration: 1000,
      });
      setShowDeleteDialog(false);
      setSelectedRoute(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete route",
        description: error?.message || "Unable to delete saved route.",
      });
    }
  };

  const handleRename = async () => {
    if (!selectedRoute || !newName.trim()) return;
    
    try {
      await updateRouteMutation.mutateAsync({
        id: selectedRoute.id,
        templateName: newName.trim(),
      });
      toast({
        title: "Route renamed",
        description: `Route renamed to "${newName.trim()}".`,
        duration: 1000,
      });
      setShowRenameDialog(false);
      setSelectedRoute(null);
      setNewName("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to rename route",
        description: error?.message || "Unable to rename saved route.",
      });
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
    });
  };

  const formatDistance = (distanceMi: number) => {
    return distanceMi >= 0.5 
      ? `${distanceMi.toFixed(1)} mi`
      : `${Math.round(distanceMi * 5280)} ft`;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="pt-safe px-4 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px] flex-shrink-0">
        <img 
          src={mspLogo} 
          alt="MSP Diesel Solutions" 
          className="h-8 w-auto"
        />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : savedRoutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Map className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">No saved routes yet</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Save routes from the Plan page for quick access in the future.
            </p>
            <Button onClick={() => navigate("/plan")} data-testid="button-go-to-plan">
              <Route className="h-4 w-4 mr-2" />
              Plan a Route
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {savedRoutes.map((route) => (
              <AccordionItem 
                key={route.id} 
                value={route.id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline px-4 py-3">
                  <div className="flex items-start justify-between w-full mr-2">
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-medium text-base mb-1 truncate">
                        {route.templateName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {route.stopCount || 0} stops
                        </span>
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {formatDistance(route.totalDistanceMi || 0)}
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(route.createdAt)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4">
                  {/* Custom Endpoint */}
                  {(() => {
                    if (route.customEndpoint && 
                        typeof route.customEndpoint === 'object' && 
                        'label' in route.customEndpoint) {
                      const label = (route.customEndpoint as { label: string }).label;
                      return (
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mb-3">
                          Ends at: {label}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Stops List */}
                  {route.stops && route.stops.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-medium mb-2">Route Stops:</div>
                      {route.stops?.map((stop, index) => (
                        <div 
                          key={stop.id} 
                          className="flex items-start gap-3 text-sm p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{stop.companyName}</div>
                            {(stop.address || stop.city || stop.state) && (
                              <div className="text-xs text-muted-foreground truncate">
                                {[stop.address, stop.city, stop.state]
                                  .filter(item => item != null)
                                  .join(", ")}
                              </div>
                            )}
                          </div>
                          {route.stops && index < route.stops.length - 1 && (
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {stop.etaFromPrevMin} min
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBuildRoute(route.id, route.templateName || "Unnamed Route")}
                      className="flex-1"
                      disabled={buildFromSavedMutation.isPending}
                      data-testid={`button-build-route-${route.id}`}
                    >
                      {buildFromSavedMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Building...
                        </>
                      ) : (
                        <>
                          <Route className="h-4 w-4 mr-2" />
                          Use Route
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedRoute(route);
                        setNewName(route.templateName || "");
                        setShowRenameDialog(true);
                      }}
                      data-testid={`button-rename-route-${route.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedRoute(route);
                        setShowDeleteDialog(true);
                      }}
                      data-testid={`button-delete-route-${route.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRoute?.templateName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedRoute(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Route</DialogTitle>
            <DialogDescription>
              Enter a new name for this saved route.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="route-name">Route Name</Label>
              <Input
                id="route-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) {
                    handleRename();
                  }
                }}
                placeholder="e.g., Monday Memphis Route"
                data-testid="input-route-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setSelectedRoute(null);
                setNewName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newName.trim() || updateRouteMutation.isPending}
              data-testid="button-save-name"
            >
              {updateRouteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}