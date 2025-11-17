import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";
import { format } from "date-fns";
import { useSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import mspLogo from "@assets/msp_logo_1762965721886.png";

export default function SummaryPage() {
  const [, navigate] = useLocation();
  const dateString = format(new Date(), "yyyy-MM-dd");
  
  const { data: summary, isLoading } = useSummary(dateString);
  const { logout } = useAuth();


  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 pt-safe px-4 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px]">
        <img 
          src={mspLogo} 
          alt="MSP Diesel Solutions" 
          className="h-8 w-auto"
        />
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Stops Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground" data-testid="text-visit-count">
                  {summary.visitCount}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-distance">
                  {summary.totalDistanceMi} mi
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Logout Button */}
        <div className="flex justify-center pb-4">
          <Button
            variant="destructive"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
