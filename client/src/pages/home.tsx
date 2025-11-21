import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { MapPin, CheckCircle2, Navigation, BookOpen, MessageSquare, TrendingUp, Circle, Settings, User, LogOut, Shield } from "lucide-react";
import { format, subDays } from "date-fns";
import { Link } from "wouter";
import mspLogo from "@assets/msp_logo_1762965721886.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { user, logout } = useAuth();

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
      <header className="md:hidden sticky top-0 z-10 px-4 pt-safe flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 min-h-[56px]">
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

      {/* Desktop spacing for fixed header */}
      <div className="hidden md:block h-16" />

      {/* Main Content */}
      <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4">
        {/* Welcome Section - Mobile */}
        <div className="md:hidden">
          <h1 className="text-xl font-bold">MSP Field Service</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user?.username}!</p>
        </div>

        {/* Yesterday's Metrics Dashboard - More Visual */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs text-green-700 dark:text-green-400 font-medium">Yesterday's Stops</CardDescription>
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-3xl md:text-4xl text-green-700 dark:text-green-300">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  summary?.visitCount || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                Completed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs text-blue-700 dark:text-blue-400 font-medium">Total Distance</CardDescription>
                <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-3xl md:text-4xl text-blue-700 dark:text-blue-300">
                {summaryLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${summary?.totalDistanceMi?.toFixed(1) || 0} mi`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
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
                    <Button variant="outline" size="sm" className="hidden md:flex" data-testid="button-manage-announcements">
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

        {/* App Usage Guide - Compact Grid Layout */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Color Legend - Compact */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-background rounded-lg">
              <div className="flex flex-col items-center gap-1.5">
                <Circle className="w-6 h-6 text-blue-500 fill-blue-500" />
                <span className="text-xs text-center text-muted-foreground">Customer</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Circle className="w-6 h-6 text-red-500 fill-red-500" />
                <span className="text-xs text-center text-muted-foreground">Lead</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Circle className="w-6 h-6 text-green-500 fill-green-500" />
                <span className="text-xs text-center text-muted-foreground">Selected</span>
              </div>
            </div>

            {/* Feature Guide - Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Plan</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select companies and build optimized routes
                </p>
              </div>

              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 mb-1.5">
                  <Navigation className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Navigate</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Follow your route and check in when nearby
                </p>
              </div>

              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">History</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Review completed routes and visits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
