import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation2, X, Loader2 } from "lucide-react";
import AddressAutocomplete from "./AddressAutocomplete";
import MapView from "./map-view";
import { useToast } from "@/hooks/use-toast";

interface EndpointSearchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (endpoint: { label: string; lat: number; lng: number }) => void;
  onRemove: () => void;
  currentEndpoint?: { label: string; lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
}

export function EndpointSearchDrawer({
  open,
  onOpenChange,
  onConfirm,
  onRemove,
  currentEndpoint,
  userLocation
}: EndpointSearchDrawerProps) {
  const [selectedPlace, setSelectedPlace] = useState<{ label: string; lat: number; lng: number } | null>(
    currentEndpoint || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  // Reset state when drawer opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedPlace(currentEndpoint || null);
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  const handleSelectPlace = (place: { id: string; description: string; lat: number; lng: number }) => {
    setSelectedPlace({
      label: place.description,
      lat: place.lat,
      lng: place.lng,
    });
  };

  const handleUseCurrentLocation = async () => {
    if (userLocation) {
      setIsGeocoding(true);
      try {
        // Reverse geocode the current location to get an address
        const response = await fetch(`/api/geocode/reverse?lat=${userLocation.lat}&lng=${userLocation.lng}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedPlace({
            label: data.address || "Current Location",
            lat: userLocation.lat,
            lng: userLocation.lng,
          });
        } else {
          setSelectedPlace({
            label: "Current Location",
            lat: userLocation.lat,
            lng: userLocation.lng,
          });
        }
      } catch (error) {
        setSelectedPlace({
          label: "Current Location",
          lat: userLocation.lat,
          lng: userLocation.lng,
        });
      } finally {
        setIsGeocoding(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Location not available",
        description: "Please enable location services to use this feature.",
      });
    }
  };

  const handleConfirm = () => {
    if (selectedPlace) {
      onConfirm(selectedPlace);
      onOpenChange(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    onOpenChange(false);
  };

  // Common destination shortcuts
  const shortcuts = [
    { icon: "🏠", label: "Home", query: "home" },
    { icon: "🍔", label: "Restaurant", query: "restaurant near me" },
    { icon: "⛽", label: "Gas Station", query: "gas station near me" },
    { icon: "🏨", label: "Hotel", query: "hotel near me" },
  ];

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="h-[90vh] max-h-[90vh] flex flex-col">
        <DrawerHeader className="pb-2 border-b">
          <DrawerTitle>End Your Route At...</DrawerTitle>
          <DrawerDescription>
            Choose where you want to finish your route
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Search Input */}
          <div className="space-y-2">
            <AddressAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSelect={handleSelectPlace}
              placeholder="Search for a destination..."
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleUseCurrentLocation}
              disabled={!userLocation || isGeocoding}
              data-testid="button-use-current-location"
            >
              {isGeocoding ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Navigation2 className="h-3 w-3 mr-1" />
              )}
              Current Location
            </Button>
            {currentEndpoint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                data-testid="button-remove-endpoint"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>

          {/* Shortcuts */}
          <div className="grid grid-cols-4 gap-2">
            {shortcuts.map((shortcut) => (
              <Button
                key={shortcut.label}
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-2"
                onClick={() => setSearchQuery(shortcut.query)}
              >
                <span className="text-lg">{shortcut.icon}</span>
                <span className="text-xs mt-1">{shortcut.label}</span>
              </Button>
            ))}
          </div>

          {/* Selected Place */}
          {selectedPlace && (
            <Card className="border-primary">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Selected Destination</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedPlace.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map Preview */}
          {selectedPlace && (
            <div className="h-[200px] rounded-lg overflow-hidden border">
              <MapView
                companies={[{
                  id: "endpoint",
                  name: selectedPlace.label,
                  street: null,
                  city: null,
                  state: null,
                  postalCode: null,
                  country: null,
                  lat: selectedPlace.lat,
                  lng: selectedPlace.lng,
                  ownerId: null,
                  hubspotId: null,
                  hubspotUrl: null,
                  lastUpdated: null,
                  deleted: false,
                  distanceMi: 0,
                }]}
                selectedCompanyIds={["endpoint"]}
                userLocation={userLocation}
              />
            </div>
          )}
        </div>

        <DrawerFooter className="border-t pt-3 pb-safe">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!selectedPlace}
              data-testid="button-confirm-endpoint"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Set Endpoint
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}