import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import MapView from "@/components/map-view";
import RadiusPicker from "@/components/radius-picker";
import CompanyList from "@/components/company-list";
import LocationSearch from "@/components/location-search";
import { RouteReorderView } from "@/components/RouteReorderView";
import { EndpointSearchDrawer } from "@/components/EndpointSearchDrawer";
import { EndpointConfirmationDrawer } from "@/components/EndpointConfirmationDrawer";
import { useCompanies, useSyncCompanies, useBuildRoute } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MapIcon, List, Route, Loader2, RefreshCw, MapPin, X, Search } from "lucide-react";
import type { BuildRouteResponse } from "@shared/schema";
import { Input } from "@/components/ui/input";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default function PlanPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMi, setRadiusMi] = useState(25);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [activeRouteData, setActiveRouteData] = useState<any | null>(null);
  const [clickedCompanyId, setClickedCompanyId] = useState<string | null>(null);
  const [customEndpoint, setCustomEndpoint] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [showEndpointDrawer, setShowEndpointDrawer] = useState(false);
  const [showEditRouteDrawer, setShowEditRouteDrawer] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<BuildRouteResponse | null>(null);
  const [showEndpointConfirmation, setShowEndpointConfirmation] = useState(false);
  const [pendingRouteForEndpoint, setPendingRouteForEndpoint] = useState<BuildRouteResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<"all" | "customer" | "lead">("all");
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { data, isLoading, refetch } = useCompanies({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    radiusMi,
    ownerOnly: true,
    search: searchQuery.trim() || undefined,
  });

  const syncMutation = useSyncCompanies();
  const buildRouteMutation = useBuildRoute();

  const companies = data?.companies || [];
  
  // Filter by lifecycle stage locally (search is handled by API)
  const filteredCompanies = lifecycleFilter === "all" 
    ? companies 
    : companies.filter(c => c.lifecycleStage === lifecycleFilter);

  // Try to get GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("GPS error:", error);
          // Default to Memphis if GPS fails
          setUserLocation({ lat: 35.1495, lng: -90.0490 });
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 35.1495, lng: -90.0490 });
    }
  }, []);

  // Check for active route on mount
  useEffect(() => {
    const checkActiveRoute = async () => {
      // First check localStorage
      const stored = localStorage.getItem("activeRoute");
      if (stored) {
        const data = JSON.parse(stored);
        setActiveRouteData(data);
        setShowResumeDialog(true);
        return;
      }

      // Then check database
      try {
        const response = await fetch('/api/route/active', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const activeRoute = await response.json();
          setActiveRouteData(activeRoute);
          setShowResumeDialog(true);
        }
      } catch (error) {
        // No active route, which is fine
        console.log('No active route found');
      }
    };

    checkActiveRoute();
  }, []);

  const handleToggleCompany = (companyId: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      toast({
        title: "Sync complete",
        description: "Companies have been updated from HubSpot",
      });
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Unable to sync companies. Please try again.",
      });
    }
  };

  const handleResumeRoute = () => {
    if (activeRouteData) {
      // Store in localStorage if it came from database
      const stored = localStorage.getItem("activeRoute");
      if (!stored) {
        // Generate simple route geometry from stops (fallback for DB routes without geometry)
        const routeGeometry = activeRouteData.stops.map((s: any) => ({ lat: s.lat, lng: s.lng }));
        
        // Convert database format to BuildRouteResponse format
        const routeResponse: BuildRouteResponse = {
          routeId: activeRouteData.id,
          stops: activeRouteData.stops,
          totalDistMi: activeRouteData.totalDistanceMi,
          totalEtaMin: activeRouteData.totalEtaMin,
          navUrl: `https://www.google.com/maps/dir/?api=1&waypoints=${activeRouteData.stops.map((s: any) => `${s.lat},${s.lng}`).join('|')}&travelmode=driving`,
          routeGeometry, // Simple geometry from stop coordinates
        };
        localStorage.setItem("activeRoute", JSON.stringify(routeResponse));
      }
      navigate("/route");
    }
    setShowResumeDialog(false);
  };

  const handleStartNewRoute = async () => {
    if (activeRouteData) {
      // Mark current route as completed
      const routeId = activeRouteData.id || activeRouteData.routeId;
      if (routeId) {
        try {
          await fetch(`/api/route/${routeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
          });
        } catch (error) {
          console.error('Failed to mark route as completed:', error);
        }
      }
      localStorage.removeItem("activeRoute");
    }
    setShowResumeDialog(false);
    setActiveRouteData(null);
  };

  // Handler for building route from edit view
  const handleBuildRouteFromEdit = async (editedRoute: BuildRouteResponse) => {
    // Show endpoint confirmation instead of immediately navigating
    setPendingRouteForEndpoint(editedRoute);
    setShowEditRouteDrawer(false);
    setShowEndpointConfirmation(true);
  };

  // Handler for confirming the last stop as endpoint
  const handleConfirmLastStop = () => {
    if (!pendingRouteForEndpoint) return;
    
    // Save route and navigate
    localStorage.setItem("activeRoute", JSON.stringify(pendingRouteForEndpoint));
    setShowEndpointConfirmation(false);
    setPendingRoute(null);
    setPendingRouteForEndpoint(null);
    
    toast({
      title: "Route started!",
      description: "Your route has been saved. Let's go!",
    });
    
    navigate("/route");
  };

  // Handler for choosing a different endpoint
  const handleChooseDifferentEndpoint = () => {
    setShowEndpointConfirmation(false);
    setShowEndpointDrawer(true);
  };

  // Handler for adding more stops
  const handleAddStops = () => {
    setShowEditRouteDrawer(false);
    // Keep pendingRoute so user can see selected companies on map
    // When they build route again, it will include new selections
  };

  // Handler for canceling route edits
  const handleCancelRouteEdits = () => {
    setShowEditRouteDrawer(false);
    setPendingRoute(null);
  };

  // Handler for setting custom endpoint
  const handleSetEndpoint = async (endpoint: { label: string; lat: number; lng: number }) => {
    setShowEndpointDrawer(false);
    
    // If we're in the endpoint confirmation flow, rebuild route with custom endpoint
    if (pendingRouteForEndpoint && userLocation) {
      try {
        // Extract company IDs from pending route stops
        const companyIds = pendingRouteForEndpoint.stops.map(stop => stop.companyId);
        
        // Rebuild route with custom endpoint
        const result = await buildRouteMutation.mutateAsync({
          origin: userLocation,
          companyIds,
          optimize: true,
          customEndpoint: endpoint,
        });
        
        // Save and navigate
        localStorage.setItem("activeRoute", JSON.stringify(result));
        setPendingRoute(null);
        setPendingRouteForEndpoint(null);
        setCustomEndpoint(null); // Clear for next time
        
        toast({
          title: "Route started!",
          description: `Your route will end at ${endpoint.label}`,
        });
        
        navigate("/route");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Route building failed",
          description: error?.message || "Unable to rebuild route with custom endpoint",
        });
      }
    } else {
      // Regular endpoint setting (not in confirmation flow)
      setCustomEndpoint(endpoint);
      
      toast({
        title: "Endpoint set!",
        description: `Your route will end at ${endpoint.label}`,
      });
    }
  };

  // Handler for removing custom endpoint
  const handleRemoveEndpoint = () => {
    setCustomEndpoint(null);
    setShowEndpointDrawer(false);
  };

  const handleBuildRoute = async () => {
    if (selectedCompanyIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No companies selected",
        description: "Please select at least 2 companies to build a route.",
      });
      return;
    }

    if (selectedCompanyIds.length < 2) {
      toast({
        variant: "destructive",
        title: "Not enough stops",
        description: "Please select at least 2 companies to build a route.",
      });
      return;
    }

    // Check if location is available
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Location not available",
        description: "Waiting for your location to build an optimized route. Please allow location access or try again in a moment.",
      });
      return;
    }

    // Check if there's already an active route
    const existingRoute = localStorage.getItem("activeRoute");
    if (existingRoute) {
      try {
        const routeData = JSON.parse(existingRoute);
        setActiveRouteData(routeData);
        setShowResumeDialog(true);
        return;
      } catch (error) {
        // Invalid data, clear it
        localStorage.removeItem("activeRoute");
      }
    }

    try {
      const result = await buildRouteMutation.mutateAsync({
        origin: userLocation,
        companyIds: selectedCompanyIds,
        optimize: true,
        customEndpoint: customEndpoint || undefined,
      });

      console.log('[Plan] Route built successfully:', result);

      // Validate response structure
      if (!result || !result.stops || !Array.isArray(result.stops)) {
        throw new Error('Invalid route response format');
      }

      // Set pending route for editing instead of navigating directly
      setPendingRoute(result);
      setShowEditRouteDrawer(true);
      
      toast({
        title: "Route created!",
        description: `${result.stops.length} stops • ${result.totalDistMi.toFixed(1)} mi • ${Math.round(result.totalEtaMin)} min`,
      });
    } catch (error: any) {
      console.error('[Plan] Route building failed:', error);
      toast({
        variant: "destructive",
        title: "Route building failed",
        description: error?.message || "Unable to build route. Please try again.",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="pt-safe px-4 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px] flex-shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Plan Route</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSync}
          disabled={syncMutation.isPending}
          data-testid="button-sync"
        >
          {syncMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map Section - Only show when there are companies and (on desktop or map tab on mobile) */}
        {filteredCompanies.length > 0 && (isDesktop || activeTab === "map") && (
          <div className="flex-1 relative">
            <MapView
              companies={filteredCompanies}
              userLocation={userLocation}
              selectedCompanyIds={selectedCompanyIds}
              customEndpoint={customEndpoint}
              onCompanyClick={(id) => {
                console.log('[Plan] onCompanyClick called with:', id, 'Currently selected:', selectedCompanyIds);
                const wasSelected = selectedCompanyIds.includes(id);
                
                if (!wasSelected) {
                  console.log('[Plan] Adding company to selection');
                  setSelectedCompanyIds([...selectedCompanyIds, id]);
                } else {
                  console.log('[Plan] Company already selected, toggling off');
                  const newSelection = selectedCompanyIds.filter(cid => cid !== id);
                  setSelectedCompanyIds(newSelection);
                  // When deselecting, show the last remaining company or clear the sheet
                  if (newSelection.length > 0) {
                    setClickedCompanyId(newSelection[newSelection.length - 1]);
                  } else {
                    setClickedCompanyId(null);
                  }
                }
              }}
              onCompanyInfo={(id) => {
                // MapView only calls this when selecting (not deselecting)
                setClickedCompanyId(id);
              }}
            />

            {/* Bottom Sheet - Company Info */}
            {clickedCompanyId && (() => {
            const company = filteredCompanies.find(c => c.id === clickedCompanyId);
            if (!company) return null;
            
            return (
              <div 
                className="md:hidden absolute bottom-0 left-0 right-0 bg-background border-t shadow-2xl rounded-t-2xl z-40 animate-in slide-in-from-bottom duration-200 pointer-events-auto"
                data-testid="company-info-sheet"
              >
                <div className="p-4">
                  {/* Drag Handle */}
                  <div className="flex justify-center mb-3">
                    <button
                      onClick={() => setClickedCompanyId(null)}
                      className="w-12 h-1 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50 transition-colors"
                      aria-label="Close"
                    />
                  </div>
                  
                  {/* Company Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {company.city}, {company.state}
                        </p>
                        {company.distanceMi && (
                          <p className="text-sm text-primary font-medium mt-1">
                            {company.distanceMi.toFixed(1)} mi away
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setClickedCompanyId(null)}
                        data-testid="button-close-info"
                      >
                        ✕
                      </Button>
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      className="w-full min-h-[44px]"
                      variant={selectedCompanyIds.includes(company.id) ? "secondary" : "default"}
                      onClick={() => {
                        handleToggleCompany(company.id);
                      }}
                      data-testid="button-toggle-selection"
                    >
                      {selectedCompanyIds.includes(company.id) ? "Remove from Route" : "Add to Route"}
                    </Button>
                  </div>
                </div>
              </div>
            );
            })()}

            {/* Floating Controls - Mobile */}
            <div className="md:hidden absolute top-4 left-4 right-4 z-10">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "map" | "list")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-background/90 backdrop-blur min-h-[48px]">
                <TabsTrigger value="map" data-testid="tab-map" className="min-h-[44px] text-base">
                  <MapIcon className="w-5 h-5 mr-2" />
                  Map
                </TabsTrigger>
                <TabsTrigger value="list" data-testid="tab-list" className="min-h-[44px] text-base">
                  <List className="w-5 h-5 mr-2" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Floating Build Route Button - Mobile Map View */}
          {selectedCompanyIds.length > 0 && activeTab === "map" && (
            <div 
              className={`md:hidden absolute left-4 right-4 z-50 transition-all duration-200 ${
                clickedCompanyId ? 'bottom-44' : 'bottom-24'
              }`}
            >
              <Button
                onClick={handleBuildRoute}
                className="w-full h-14 text-base font-semibold shadow-xl"
                disabled={selectedCompanyIds.length < 2 || buildRouteMutation.isPending}
                data-testid="button-build-route-mobile"
              >
                {buildRouteMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Building Route...
                  </>
                ) : (
                  <>
                    <Route className="w-5 h-5 mr-2" />
                    Build Route ({selectedCompanyIds.length} stops)
                  </>
                )}
              </Button>
            </div>
            )}
          </div>
        )}

        {/* Controls Panel - Desktop or Mobile Sheet */}
        <div className={`${activeTab === "list" || isDesktop ? "block" : "hidden"} md:block ${filteredCompanies.length > 0 ? 'md:w-96' : 'md:flex-1'} bg-background border-l overflow-y-auto`}>
          <div className="p-4 space-y-6">
            {/* Start Route Button - Top of List View */}
            {selectedCompanyIds.length >= 2 && (
              <div className="sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-3 bg-background/95 backdrop-blur border-b">
                {/* Build Route Button */}
                <Button
                  onClick={handleBuildRoute}
                  className="w-full h-14 text-base font-semibold shadow-lg"
                  disabled={buildRouteMutation.isPending}
                  data-testid="button-start-route-top"
                >
                  {buildRouteMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Building Route...
                    </>
                  ) : (
                    <>
                      <Route className="w-5 h-5 mr-2" />
                      Start Route ({selectedCompanyIds.length} stops)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Location Search */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Starting Location</h3>
              <LocationSearch onLocationSelect={(lat, lng) => setUserLocation({ lat, lng })} />
            </Card>

            {/* Radius Picker */}
            <Card className="p-4">
              <RadiusPicker value={radiusMi} onChange={setRadiusMi} />
            </Card>

            {/* Company List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    `Nearby Companies (${companies.length})`
                  )}
                </h3>
                {selectedCompanyIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCompanyIds([])}
                    data-testid="button-clear-selection"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                  data-testid="input-search-companies"
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

              {/* Lifecycle Stage Filter */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={lifecycleFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLifecycleFilter("all")}
                  className="flex-1"
                  data-testid="button-filter-all"
                >
                  All
                </Button>
                <Button
                  variant={lifecycleFilter === "customer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLifecycleFilter("customer")}
                  className="flex-1"
                  data-testid="button-filter-customer"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  Customers
                </Button>
                <Button
                  variant={lifecycleFilter === "lead" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLifecycleFilter("lead")}
                  className="flex-1"
                  data-testid="button-filter-lead"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  Leads
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">No companies match your search</p>
                  </div>
                </Card>
              ) : (
                <CompanyList
                  companies={filteredCompanies}
                  selectedIds={selectedCompanyIds}
                  onToggle={handleToggleCompany}
                  onCompanyClick={(id) => {
                    if (!selectedCompanyIds.includes(id)) {
                      setSelectedCompanyIds([...selectedCompanyIds, id]);
                    }
                  }}
                />
              )}
            </div>

            {/* Build Route Button */}
            {selectedCompanyIds.length > 0 && (
              <div className="sticky bottom-0 pt-4 pb-2 bg-background">
                <Button
                  onClick={handleBuildRoute}
                  className="w-full h-12 text-base font-semibold"
                  disabled={selectedCompanyIds.length === 0 || buildRouteMutation.isPending}
                  data-testid="button-build-route"
                >
                  {buildRouteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Building Route...
                    </>
                  ) : (
                    <>
                      <Route className="w-4 h-4 mr-2" />
                      Build Route ({selectedCompanyIds.length} stops)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Route Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Route Found</AlertDialogTitle>
            <AlertDialogDescription>
              You have an active route in progress.{" "}
              {activeRouteData?.stops && (
                <>
                  It has {activeRouteData.stops.length} stop{activeRouteData.stops.length > 1 ? 's' : ''} 
                  {activeRouteData.stops.filter((s: any) => s.completed).length > 0 && (
                    <> ({activeRouteData.stops.filter((s: any) => s.completed).length} completed)</>
                  )}.
                </>
              )}
              {" "}Would you like to resume it or start a new route?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartNewRoute} data-testid="button-start-new">
              Start New Route
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeRoute} data-testid="button-resume-route">
              Resume Route
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Route Reorder Full-Screen View */}
      <RouteReorderView
        open={showEditRouteDrawer}
        onClose={() => setShowEditRouteDrawer(false)}
        route={pendingRoute}
        onBuildRoute={handleBuildRouteFromEdit}
        onAddStops={handleAddStops}
        onCancel={handleCancelRouteEdits}
        customEndpoint={customEndpoint}
      />

      {/* Endpoint Confirmation Drawer */}
      <EndpointConfirmationDrawer
        open={showEndpointConfirmation}
        onOpenChange={setShowEndpointConfirmation}
        lastStop={pendingRouteForEndpoint?.stops?.[pendingRouteForEndpoint.stops.length - 1] || null}
        onConfirmLastStop={handleConfirmLastStop}
        onChooseDifferent={handleChooseDifferentEndpoint}
      />

      {/* Endpoint Search Drawer */}
      <EndpointSearchDrawer
        open={showEndpointDrawer}
        onOpenChange={setShowEndpointDrawer}
        onConfirm={handleSetEndpoint}
        onRemove={handleRemoveEndpoint}
        currentEndpoint={customEndpoint}
        userLocation={userLocation}
      />
    </div>
  );
}
