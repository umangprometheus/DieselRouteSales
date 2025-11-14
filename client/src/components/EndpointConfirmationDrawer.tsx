import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation2, Check, Save } from "lucide-react";
import type { RouteStopApi } from "@shared/schema";

interface EndpointConfirmationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastStop: RouteStopApi | null;
  onConfirmLastStop: () => void;
  onChooseDifferent: () => void;
  onSaveForFuture?: () => void;
}

export function EndpointConfirmationDrawer({
  open,
  onOpenChange,
  lastStop,
  onConfirmLastStop,
  onChooseDifferent,
  onSaveForFuture,
}: EndpointConfirmationDrawerProps) {
  if (!lastStop) return null;

  const formatAddress = (stop: RouteStopApi) => {
    const parts = [stop.street, stop.city, stop.state, stop.postalCode].filter(Boolean);
    return parts.join(", ") || "Unknown location";
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Where should your route end?</DrawerTitle>
          <DrawerDescription>
            By default, your route will end at the last stop. You can confirm this or choose a different location (like home or office).
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base mb-1">{lastStop.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatAddress(lastStop)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground mt-3 px-1">
            This helps optimize your route to end where it makes the most sense for you.
          </p>
        </div>

        <DrawerFooter className="pt-0">
          <Button
            onClick={onConfirmLastStop}
            className="w-full"
            size="lg"
            data-testid="button-confirm-last-stop"
          >
            <Check className="h-5 w-5 mr-2" />
            Yes, end here
          </Button>
          <Button
            variant="outline"
            onClick={onChooseDifferent}
            className="w-full"
            data-testid="button-choose-different-endpoint"
          >
            <Navigation2 className="h-4 w-4 mr-2" />
            Choose different location
          </Button>
          {onSaveForFuture && (
            <Button
              variant="secondary"
              onClick={onSaveForFuture}
              className="w-full"
              data-testid="button-save-for-future"
            >
              <Save className="h-4 w-4 mr-2" />
              Save for Future Use
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
