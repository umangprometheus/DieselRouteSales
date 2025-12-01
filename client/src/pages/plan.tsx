import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MapView from "@/components/map-view";
import RadiusPicker from "@/components/radius-picker";
import CompanyList from "@/components/company-list";
import LocationSearch from "@/components/location-search";
import { RouteReorderView } from "@/components/RouteReorderView";
import { EndpointSearchDrawer } from "@/components/EndpointSearchDrawer";
import { EndpointConfirmationDrawer } from "@/components/EndpointConfirmationDrawer";
import { useCompanies, useSyncCompanies, useBuildRoute, useSaveRoute } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { MapIcon, List, Route, Loader2, RefreshCw, MapPin, X, Search, Save, Settings2, User, LogOut, Shield } from "lucide-react";
import type { BuildRouteResponse } from "@shared/schema";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import mspLogo from "@assets/msp_logo_1762965721886.png";

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
  const { user, logout } = useAuth();
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveRouteName, setSaveRouteName] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Handle opening endpoint confirmation after reorder view closes (iOS Safari fix)
  useEffect(() => {
    // Only open endpoint confirmation after reorder drawer has fully closed
    if (!showEditRouteDrawer && pendingRouteForEndpoint && !showEndpointConfirmation) {
      // Use requestAnimationFrame to ensure the previous overlay has fully unmounted
      const frameId = requestAnimationFrame(() => {
        console.log('[Plan] Opening endpoint confirmation after reorder close');
        setShowEndpointConfirmation(true);
      });
      
      return () => cancelAnimationFrame(frameId);
    }
  }, [showEditRouteDrawer, pendingRouteForEndpoint, showEndpointConfirmation]);

  const { data, isLoading, refetch } = useCompanies({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    radiusMi,
    ownerOnly: true,
    search: searchQuery.trim() || undefined,
  });

  const syncMutation = useSyncCompanies();
  const buildRouteMutation = useBuildRoute();
  const saveRouteMutation = useSaveRoute();

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
    console.log('[Plan] handleBuildRouteFromEdit called with route:', editedRoute);
    console.log('[Plan] Current showEditRouteDrawer:', showEditRouteDrawer);
    
    // Store the route and close the drawer
    // The useEffect below will handle opening the endpoint confirmation
    setPendingRouteForEndpoint(editedRoute);
    console.log('[Plan] Setting showEditRouteDrawer to false');
    setShowEditRouteDrawer(false);
    console.log('[Plan] handleBuildRouteFromEdit complete');
  };

  // Handler for confirming the last stop as endpoint
  const handleConfirmLastStop = () => {
    if (!pendingRouteForEndpoint) return;
    
    // Save route and navigate
    localStorage.setItem("activeRoute", JSON.stringify(pendingRouteForEndpoint));
    setShowEndpointConfirmation(false);
    
    // Clear state after a frame to avoid re-triggering the useEffect
    requestAnimationFrame(() => {
      setPendingRoute(null);
      setPendingRouteForEndpoint(null);
    });
    
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

  // Handler for saving route for future use
  const handleSaveForFuture = () => {
    setShowEndpointConfirmation(false);
    setShowSaveDialog(true);
    setSaveRouteName("");
  };

  // Handler for confirming save route
  const handleConfirmSaveRoute = async () => {
    if (!pendingRouteForEndpoint || !saveRouteName.trim()) return;

    try {
      await saveRouteMutation.mutateAsync({
        templateName: saveRouteName.trim(),
        routeData: {
          stops: pendingRouteForEndpoint.stops as any,
          totalDistanceMi: pendingRouteForEndpoint.totalDistMi,
          totalEtaMin: pendingRouteForEndpoint.totalEtaMin,
          routeGeometry: pendingRouteForEndpoint.routeGeometry,
          customEndpoint: pendingRouteForEndpoint.customEndpoint,
        },
      });

      setShowSaveDialog(false);
      setPendingRoute(null);
      setPendingRouteForEndpoint(null);
      setSaveRouteName("");
      
      toast({
        title: "Route saved!",
        description: `"${saveRouteName}" has been saved for future use.`,
      });
      
      // Clear selection to go back to planning
      setSelectedCompanyIds([]);
      setCustomEndpoint(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save route",
        description: error?.message || "Unable to save route for future use.",
      });
    }
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
    setPendingRouteForEndpoint(null); // Clear this to prevent re-triggering endpoint confirmation
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
      {/* Header - Mobile only, desktop uses DesktopHeader */}
      <header className="md:hidden pt-safe px-4 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px] flex-shrink-0">
        <img 
          src={mspLogo} 
          alt="MSP Diesel Solutions" 
          className="h-8 w-auto flex-shrink-0"
        />
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-user-menu-mobile">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium">
              {user?.username}
            </div>
            <DropdownMenuSeparator />
            {(user as any)?.isAdmin && (
              <>
                <Link href="/admin">
                  <DropdownMenuItem data-testid="link-admin-panel">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={logout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content - md:pt-16 accounts for fixed DesktopHeader */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden md:pt-16">
        {/* Mobile Tab Controls - Always visible on mobile */}
        <div className="md:hidden sticky top-0 left-0 right-0 z-30 p-4 pb-4 bg-background">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "map" | "list")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-auto p-1">
              <TabsTrigger 
                value="map" 
                data-testid="tab-map" 
                className="h-12 text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <MapIcon className="w-5 h-5 mr-2" />
                Map
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                data-testid="tab-list" 
                className="h-12 text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <List className="w-5 h-5 mr-2" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Map Section - Always render, control visibility with CSS */}
        <div className={`flex-1 relative ${activeTab === "map" ? "block" : "hidden"} md:block`}>
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

          </div>

        {/* Controls Panel - Always render, control visibility with CSS */}
        <div className={`${activeTab === "list" ? "block" : "hidden"} md:block md:w-96 bg-background border-l overflow-y-auto relative`}>
          <div className="p-3 pb-24 md:pb-3 space-y-2">
            {/* Mobile: Minimal top bar with filters button / Desktop: Full controls */}
            <div className="sticky top-0 z-20 -mx-3 -mt-3 px-3 py-2 bg-background/95 backdrop-blur border-b md:hidden">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  Companies ({filteredCompanies.length})
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="h-11"
                  data-testid="button-show-filters"
                >
                  <Settings2 className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Desktop: Compact Action Bar */}
            <div className="hidden md:block sticky top-0 z-20 -mx-3 -mt-3 px-3 py-2 bg-background/95 backdrop-blur border-b">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-sm">
                  {selectedCompanyIds.length === 0 ? (
                    <span className="text-muted-foreground">Select companies to build route</span>
                  ) : selectedCompanyIds.length === 1 ? (
                    <span className="font-medium">1 company • Select 1 more</span>
                  ) : (
                    <span className="font-medium">{selectedCompanyIds.length} companies selected</span>
                  )}
                </div>
                <Button
                  onClick={handleBuildRoute}
                  size="sm"
                  className="h-9"
                  disabled={selectedCompanyIds.length < 2 || buildRouteMutation.isPending}
                  data-testid="button-start-route-desktop"
                >
                  {buildRouteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <Route className="w-4 h-4 mr-1" />
                      Start Route
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Desktop: Filter Section (always visible on desktop) */}
            <div className="hidden md:block bg-muted/40 rounded-md p-3 space-y-3">
              {/* Location */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Starting Location</label>
                <LocationSearch onLocationSelect={(lat, lng) => setUserLocation({ lat, lng })} />
              </div>
              
              {/* Radius */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Search Radius</label>
                <RadiusPicker value={radiusMi} onChange={setRadiusMi} />
              </div>
            </div>

            {/* Search Bar (Always Visible on Mobile) */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10"
                data-testid="input-search-companies-mobile"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-clear-search-mobile"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Lifecycle Filter Chips (Mobile) */}
            <div className="flex gap-2 md:hidden">
              <Button
                variant={lifecycleFilter === "all" ? "default" : "outline"}
                onClick={() => setLifecycleFilter("all")}
                className="flex-1 h-11"
                data-testid="button-filter-all-mobile"
              >
                All
              </Button>
              <Button
                variant={lifecycleFilter === "customer" ? "default" : "outline"}
                onClick={() => setLifecycleFilter("customer")}
                className="flex-1 h-11"
                data-testid="button-filter-customer-mobile"
              >
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <span>Customers</span>
              </Button>
              <Button
                variant={lifecycleFilter === "lead" ? "default" : "outline"}
                onClick={() => setLifecycleFilter("lead")}
                className="flex-1 h-11"
                data-testid="button-filter-lead-mobile"
              >
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <span>Leads</span>
              </Button>
            </div>

            {/* Company List */}
            <div>
              <div className="hidden md:flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <>Companies ({filteredCompanies.length})</>
                  )}
                </h3>
                {selectedCompanyIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setSelectedCompanyIds([]);
                      setClickedCompanyId(null);
                    }}
                    data-testid="button-clear-selection"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Desktop Search and Filters */}
              <div className="hidden md:block space-y-2 mb-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-9"
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
                <div className="flex gap-1">
                  <Button
                    variant={lifecycleFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLifecycleFilter("all")}
                    className="flex-1 h-8"
                    data-testid="button-filter-all"
                  >
                    All
                  </Button>
                  <Button
                    variant={lifecycleFilter === "customer" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLifecycleFilter("customer")}
                    className="flex-1 h-8"
                    data-testid="button-filter-customer"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                    <span className="text-xs">Customers</span>
                  </Button>
                  <Button
                    variant={lifecycleFilter === "lead" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLifecycleFilter("lead")}
                    className="flex-1 h-8"
                    data-testid="button-filter-lead"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                    <span className="text-xs">Leads</span>
                  </Button>
                </div>
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
        onOpenChange={(open) => {
          console.log('[Plan] EndpointDrawer onOpenChange:', open);
          setShowEndpointConfirmation(open);
        }}
        lastStop={(() => {
          const lastStop = pendingRouteForEndpoint?.stops?.[pendingRouteForEndpoint.stops.length - 1] || null;
          console.log('[Plan] Passing lastStop to drawer:', lastStop?.name, 'open:', showEndpointConfirmation);
          return lastStop;
        })()}
        onConfirmLastStop={handleConfirmLastStop}
        onChooseDifferent={handleChooseDifferentEndpoint}
        onSaveForFuture={handleSaveForFuture}
        onBack={() => {
          // Go back to route reorder view
          setShowEndpointConfirmation(false);
          setPendingRoute(pendingRouteForEndpoint);
          setShowEditRouteDrawer(true);
        }}
      />

      {/* Endpoint Search Drawer */}
      <EndpointSearchDrawer
        open={showEndpointDrawer}
        onOpenChange={setShowEndpointDrawer}
        onConfirm={handleSetEndpoint}
        onRemove={handleRemoveEndpoint}
        currentEndpoint={customEndpoint}
        userLocation={userLocation}
        onBack={() => {
          // Go back to endpoint confirmation
          setShowEndpointDrawer(false);
          setShowEndpointConfirmation(true);
        }}
      />

      {/* Save Route Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Route for Future Use</DialogTitle>
            <DialogDescription>
              Give this route a name so you can quickly use it again in the future.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="route-name">Route Name</Label>
              <Input
                id="route-name"
                placeholder="e.g., Monday Memphis Route"
                value={saveRouteName}
                onChange={(e) => setSaveRouteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveRouteName.trim()) {
                    handleConfirmSaveRoute();
                  }
                }}
                data-testid="input-route-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSaveDialog(false)}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSaveRoute}
              disabled={!saveRouteName.trim() || saveRouteMutation.isPending}
              data-testid="button-confirm-save"
            >
              {saveRouteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Route
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Sheet for Mobile */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent 
          side="bottom" 
          className="h-auto max-h-[80vh] rounded-t-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Adjust your search criteria
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            {/* Location */}
            <div>
              <Label className="text-sm font-medium mb-2">Starting Location</Label>
              <LocationSearch onLocationSelect={(lat, lng) => {
                setUserLocation({ lat, lng });
                setTimeout(() => setShowFilters(false), 200);
              }} />
            </div>
            
            {/* Radius */}
            <div>
              <Label className="text-sm font-medium mb-2">Search Radius</Label>
              <RadiusPicker value={radiusMi} onChange={(val) => {
                setRadiusMi(val);
              }} />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button 
              onClick={() => setShowFilters(false)}
              className="w-full"
              data-testid="button-apply-filters"
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Action Bar - positioned above BottomNav on both Map and List tabs */}
      {/* Hide when overlays are open to prevent z-index conflicts */}
      {!isDesktop && !showEditRouteDrawer && !showEndpointDrawer && !showEndpointConfirmation && (
        <div className="fixed bottom-[64px] left-0 right-0 z-50 md:hidden bg-background border-t shadow-lg px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Selection Status */}
            <div className="text-center text-sm">
              {selectedCompanyIds.length === 0 ? (
                <span className="text-muted-foreground">Select companies to build route</span>
              ) : selectedCompanyIds.length === 1 ? (
                <span className="font-medium">1 company selected • Select 1 more</span>
              ) : (
                <span className="font-medium">{selectedCompanyIds.length} companies selected</span>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Clear Selection Button - only show when companies are selected */}
              {selectedCompanyIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCompanyIds([]);
                    setClickedCompanyId(null);
                  }}
                  className="h-12"
                  data-testid="button-clear-selection-mobile"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              
              {/* Start Route Button */}
              <Button
                onClick={handleBuildRoute}
                className="flex-1 h-12"
                disabled={selectedCompanyIds.length < 2 || buildRouteMutation.isPending}
                data-testid="button-start-route-mobile"
              >
                {buildRouteMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Building Route...
                  </>
                ) : (
                  <>
                    <Route className="w-5 h-5 mr-2" />
                    Start Route ({selectedCompanyIds.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
