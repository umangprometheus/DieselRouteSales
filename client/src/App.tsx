import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import DesktopHeader from "@/components/desktop-header";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import PlanPage from "@/pages/plan";
import RoutePage from "@/pages/route";
import HistoryPage from "@/pages/history";
import SavedPage from "@/pages/saved";
import AdminPage from "@/pages/admin";
import CheckInSubmitPage from "@/pages/check-in-submit";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Login route */}
      <Route path="/login" component={LoginPage} />
      
      {/* Protected routes */}
      <Route path="/">
        {isAuthenticated ? <HomePage /> : <Redirect to="/login" />}
      </Route>
      <Route path="/plan">
        {isAuthenticated ? <PlanPage /> : <Redirect to="/login" />}
      </Route>
      <Route path="/route">
        {isAuthenticated ? <RoutePage /> : <Redirect to="/login" />}
      </Route>
      <Route path="/history">
        {isAuthenticated ? <HistoryPage /> : <Redirect to="/login" />}
      </Route>
      <Route path="/saved">
        {isAuthenticated ? <SavedPage /> : <Redirect to="/login" />}
      </Route>
      <Route path="/admin">
        {isAuthenticated ? <AdminPage /> : <Redirect to="/login" />}
      </Route>
      <Route path="/check-in/submit">
        {isAuthenticated ? <CheckInSubmitPage /> : <Redirect to="/login" />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function BottomNavWrapper() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Hide bottom nav on login page and check-in submit flow
  const isLoginRoute = location === "/login";
  const isCheckInFlow = location.startsWith("/check-in");
  const showBottomNav = isAuthenticated && !isLoginRoute && !isCheckInFlow;

  if (!showBottomNav) return null;
  return <BottomNav />;
}

function DesktopHeaderWrapper() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Hide desktop header on login page and check-in submit flow
  const isLoginRoute = location === "/login";
  const isCheckInFlow = location.startsWith("/check-in");
  const showDesktopHeader = isAuthenticated && !isLoginRoute && !isCheckInFlow;

  if (!showDesktopHeader) return null;
  return <DesktopHeader />;
}

function AppContent() {
  return (
    <div className="relative min-h-screen">
      <DesktopHeaderWrapper />
      <div className="md:pt-16">
        <Router />
      </div>
      <BottomNavWrapper />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
