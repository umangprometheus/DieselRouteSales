import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, MapIcon, Route, History, User, Save, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import mspLogo from "@assets/msp_logo_1762965721886.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const allNavItems = [
  { path: "/plan", label: "Plan", icon: MapIcon },
  { path: "/route", label: "Route", icon: Route },
  { path: "/history", label: "History", icon: History },
  { path: "/saved", label: "Saved", icon: Save },
  { path: "/summary", label: "Summary", icon: User },
];

export default function DesktopHeader() {
  const [location] = useLocation();
  const [hasActiveRoute, setHasActiveRoute] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Check if there's an active route
  useEffect(() => {
    const checkActiveRoute = () => {
      const activeRoute = localStorage.getItem("activeRoute");
      setHasActiveRoute(!!activeRoute);
    };

    checkActiveRoute();
    window.addEventListener("storage", checkActiveRoute);
    const interval = setInterval(checkActiveRoute, 1000);

    return () => {
      window.removeEventListener("storage", checkActiveRoute);
      clearInterval(interval);
    };
  }, []);

  // Filter nav items based on active route
  const navItems = allNavItems.filter(
    (item) => item.path !== "/route" || hasActiveRoute
  );

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync", {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Sync complete",
        description: "Companies updated from HubSpot",
        duration: 1000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 items-center justify-between px-4">
      {/* Left: Hamburger Menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-primary text-primary-foreground hover:bg-primary/90" 
              data-testid="button-desktop-menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <Link key={item.path} href={item.path}>
                  <DropdownMenuItem
                    className={isActive ? "bg-primary/5 text-primary" : ""}
                    data-testid={`desktop-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                </Link>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* App Logo */}
        <img 
          src={mspLogo} 
          alt="MSP Diesel Solutions" 
          className="h-8 w-auto"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-desktop"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          Sync
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-user-menu">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium">
              {user?.username}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
