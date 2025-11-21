import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { MapPin, CheckCircle2, Navigation, BookOpen, MessageSquare, TrendingUp, Circle, Settings } from "lucide-react";
import { format, subDays } from "date-fns";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  // Fetch announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
    enabled: !!user,
  });

  // Fetch yesterday's summary
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const { data: summary, isLoading: summaryLoading } = useQuery<any>({
    queryKey: [`/api/summary?date=${yesterday}`],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Header - Mobile only */}
      <div className="md:hidden sticky top-0 z-30 p-4 bg-background border-b">
        <h1 className="text-2xl font-bold">MSP Field Service</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.username}!</p>
      </div>

      {/* Desktop spacing for fixed header */}
      <div className="hidden md:block h-16" />

      {/* Main Content */}
      <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold mb-1">MSP Field Service</h1>
          <p className="text-muted-foreground">Welcome back, {user?.username}!</p>
        </div>

        {/* Yesterday's Metrics Dashboard */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Yesterday's Stops</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  summary?.visitCount || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Distance</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${summary?.totalDistanceMi?.toFixed(1) || 0} mi`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-xs text-muted-foreground">
                <Navigation className="w-3 h-3 mr-1" />
                Traveled
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements - Featured when available */}
        {announcementsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : announcements && announcements.length > 0 ? (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <MessageSquare className="w-6 h-6" />
                    Team Announcements
                    <Badge variant="default" className="ml-2">
                      {announcements.length} New
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1.5">Important updates from leadership</CardDescription>
                </div>
                {(user as any)?.isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" data-testid="button-manage-announcements">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.slice(0, 3).map((announcement: any) => (
                <div 
                  key={announcement.id} 
                  className="border-l-4 border-primary pl-4 py-3 bg-background rounded-r-md"
                  data-testid={`announcement-${announcement.id}`}
                >
                  <h4 className="font-semibold text-base">{announcement.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{announcement.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(announcement.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              ))}
              {announcements.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {announcements.length - 3} more announcement{announcements.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (user as any)?.isAdmin ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Team Announcements
              </CardTitle>
              <CardDescription>No announcements yet</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="default" className="w-full" data-testid="button-create-first-announcement">
                  <Settings className="w-4 h-4 mr-2" />
                  Create First Announcement
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* App Usage Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              How to Use This App
            </CardTitle>
            <CardDescription>Quick guide to field service features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Legend */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Map Color Guide</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="w-4 h-4 text-blue-500 fill-blue-500" />
                  <span className="text-muted-foreground">Blue = Customer (existing account)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="w-4 h-4 text-red-500 fill-red-500" />
                  <span className="text-muted-foreground">Red = Lead (potential customer)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="w-4 h-4 text-green-500 fill-green-500" />
                  <span className="text-muted-foreground">Green = Selected for route</span>
                </div>
              </div>
            </div>

            {/* Feature Guide */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Plan</Badge>
                  <h4 className="font-semibold text-sm">Route Planning</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-1">
                  Set your starting location and search radius. Select companies on the map or list, then tap "Start Route" to build an optimized driving route.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Route</Badge>
                  <h4 className="font-semibold text-sm">Active Navigation</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-1">
                  Follow your route in real-time. When you're within 800 feet of a stop, you'll see a "Check In" button. Tap to record your visit with voice notes or manual entry.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">History</Badge>
                  <h4 className="font-semibold text-sm">Past Routes</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-1">
                  Review completed routes and check-ins. View detailed visit data and sync status with HubSpot.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Saved</Badge>
                  <h4 className="font-semibold text-sm">Route Templates</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-1">
                  Save frequently-used routes as templates. Quickly build the same route pattern for regular service runs.
                </p>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="pt-2 border-t">
              <h4 className="font-semibold text-sm mb-2">Pro Tips</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>AI voice transcription extracts structured data from your field notes automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Tap the map to select companies - no need to scroll through the list</span>
                </li>
                <li className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Routes sync to HubSpot automatically - all your visit data is backed up</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
