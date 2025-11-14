import { useState } from "react";
import { useLocation } from "wouter";
import { useSavedRoutes, useBuildFromSaved, useDeleteSavedRoute, useUpdateSavedRoute } from "@/lib/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { MapPin, Route, Trash2, Edit, Loader2, Map, Calendar } from "lucide-react";

export default function SavedPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useSavedRoutes();
  const buildFromSavedMutation = useBuildFromSaved();
  const deleteRouteMutation = useDeleteSavedRoute();
  const updateRouteMutation = useUpdateSavedRoute();

  const savedRoutes = data?.routes || [];

  const handleBuildRoute = async (routeId: string) => {
    try {
      const result = await buildFromSavedMutation.mutateAsync(routeId);
      localStorage.setItem("activeRoute", JSON.stringify(result));
      toast({
        title: "Route activated!",
        description: "Your saved route is now active. Let's go!",
      });
      navigate("/route");
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
      <div className="border-b bg-background">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold">Saved Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your saved route templates for quick access
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
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
          <div className="grid gap-4">
            {savedRoutes.map((route) => (
              <Card key={route.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base mb-1 truncate">
                        {route.templateName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {route.stopCount || 0} stops
                        </span>
                        <span className="flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {formatDistance(route.totalDistanceMi || 0)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(route.createdAt)}
                    </Badge>
                  </div>

                  {route.customEndpoint && 
                   typeof route.customEndpoint === 'object' && 
                   'label' in route.customEndpoint && 
                   typeof (route.customEndpoint as any).label === 'string' && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mt-2">
                      Ends at: {String((route.customEndpoint as any).label)}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button
                    onClick={() => handleBuildRoute(route.id)}
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
                    data-testid={`button-edit-${route.id}`}
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
                    data-testid={`button-delete-${route.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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
            <AlertDialogCancel onClick={() => setSelectedRoute(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteRouteMutation.isPending}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              {deleteRouteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
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
              <Label htmlFor="new-route-name">Route Name</Label>
              <Input
                id="new-route-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) {
                    handleRename();
                  }
                }}
                placeholder="Enter new name"
                data-testid="input-new-route-name"
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
              data-testid="button-cancel-rename"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newName.trim() || updateRouteMutation.isPending}
              data-testid="button-confirm-rename"
            >
              {updateRouteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Renaming...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}