import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieSession from "cookie-session";
import { storage } from "./storage";
import { 
  createFieldVisitCheckIn 
} from "./services/hubspot";
import { hashPassword, verifyPassword } from "./services/auth";
import { geocodeAddress, reverseGeocode, optimizeRoute, getRoute } from "./services/mapbox";
import { 
  calculateDistanceMiles, 
  calculateDistanceMeters,
  filterByRadius, 
  buildAddressString,
  orderByNearestNeighbor 
} from "./services/geo";
import { syncCompanies } from "./services/sync";
import type { 
  Company,
  CompanyWithDistance,
  BuildRouteRequest, 
  CheckInRequest,
  RouteStop,
  RouteStopApi,
  loginSchema
} from "@shared/schema";

// Session middleware
function setupSession(app: Express) {
  app.use(
    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "dev-secret-key"],
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
  );
}

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
  }
  next();
}

// Create demo user on startup
async function ensureDemoUser() {
  const existingUser = await storage.getUserByUsername("demo");
  if (!existingUser) {
    const passwordHash = await hashPassword("demo123");
    await storage.createUser({
      username: "demo",
      passwordHash,
      email: "demo@mspdiesel.com",
      name: "Demo User",
      hubspotOwnerId: null,
    });
    console.log("✅ Created demo user (username: demo, password: demo123)");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupSession(app);
  
  // Ensure demo user exists
  await ensureDemoUser();
  
  // Seed demo companies for testing
  const { seedDemoCompanies } = await import("./seed-data");
  await seedDemoCompanies();

  // ============================================================================
  // Auth Routes
  // ============================================================================

  // Login with username/password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { loginSchema } = await import("@shared/schema");
      const credentials = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(credentials.username);
      
      if (!user) {
        return res.status(401).json({
          error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" }
        });
      }

      // Verify password using bcrypt
      const isValid = await verifyPassword(credentials.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" }
        });
      }

      // Set session
      (req as any).session.userId = user.id;
      (req as any).session.username = user.username;

      // Return user info (without password)
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({
        error: { code: "AUTH_FAILED", message: "Authentication failed" }
      });
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser((req as any).session.userId);
    if (!user) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session = null;
    res.json({ success: true });
  });

  // ============================================================================
  // Companies Routes
  // ============================================================================

  // Get nearby companies
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
      const radiusMi = parseInt(req.query.radiusMi as string) || 25;
      const search = req.query.search as string;

      // Get current user to check for owner ID filtering
      const user = await storage.getUser((req as any).session.userId);
      if (!user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not found" } });
      }

      // Get companies with tiered visibility:
      // - If user has hubspotOwnerId: show assigned companies + unassigned companies (NULL owner_id)
      // - If no hubspotOwnerId: show all companies
      let companies: Company[];
      if (user.hubspotOwnerId) {
        // Get all companies, then filter to include user's companies + unassigned
        const allCompanies = await storage.getAllCompanies();
        companies = allCompanies.filter(
          (c) => c.ownerId === user.hubspotOwnerId || c.ownerId === null
        );
      } else {
        companies = await storage.getAllCompanies();
      }

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        companies = companies.filter((c) =>
          c.name.toLowerCase().includes(searchLower) ||
          (c.customerNumber ?? "").toLowerCase().includes(searchLower) ||
          c.city?.toLowerCase().includes(searchLower) ||
          c.state?.toLowerCase().includes(searchLower)
        );
      }

      // Filter by radius if location provided (skip radius filter when searching)
      let companiesWithDistance: CompanyWithDistance[];
      if (!search && lat !== null && lng !== null) {
        companiesWithDistance = filterByRadius(companies, lat, lng, radiusMi) as CompanyWithDistance[];
      } else if (search && lat !== null && lng !== null) {
        // When searching, return all matching companies with distance calculated
        companiesWithDistance = companies
          .filter((c) => c.lat !== null && c.lng !== null)
          .map((c) => {
            const distanceMi = calculateDistanceMiles(
              lat,
              lng,
              c.lat!,
              c.lng!
            );
            return { ...c, distanceMi };
          }) as CompanyWithDistance[];
      } else {
        // No location - return all with distance 0
        companiesWithDistance = companies
          .filter((c) => c.lat !== null && c.lng !== null)
          .map((c) => ({ ...c, distanceMi: 0 })) as CompanyWithDistance[];
      }

      // Deduplicate companies by name - prefer the one with a customer number
      const deduplicatedMap = new Map<string, CompanyWithDistance>();
      for (const company of companiesWithDistance) {
        const key = company.name.toLowerCase().trim();
        const existing = deduplicatedMap.get(key);
        
        // Keep the company if:
        // 1. No existing company with this name yet
        // 2. This one has a customer number and the existing doesn't
        // 3. Both have customer numbers but this one has a higher ID (more recent)
        if (!existing || 
            (company.customerNumber && !existing.customerNumber) ||
            (company.customerNumber && existing.customerNumber && company.id > existing.id)) {
          deduplicatedMap.set(key, company);
        }
      }
      
      // Convert back to array and sort by distance
      const dedupedCompanies = Array.from(deduplicatedMap.values())
        .sort((a, b) => a.distanceMi - b.distanceMi);

      res.json({ companies: dedupedCompanies });
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch companies" } });
    }
  });

  // Force sync companies from HubSpot
  app.post("/api/sync", requireAuth, async (req, res) => {
    try {
      await syncCompanies();
      res.json({ success: true, message: "Company sync initiated" });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: { code: "SYNC_ERROR", message: "Failed to sync companies" } });
    }
  });

  // Geocode an address to get lat/lng
  app.get("/api/geocode", requireAuth, async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ 
          error: { code: "INVALID_REQUEST", message: "Address parameter required" } 
        });
      }

      const coords = await geocodeAddress(address);
      
      if (!coords) {
        return res.status(404).json({ 
          error: { code: "NOT_FOUND", message: "Address not found" } 
        });
      }

      res.json({ ...coords, address });
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ 
        error: { code: "GEOCODING_ERROR", message: "Failed to geocode address" } 
      });
    }
  });

  // Reverse geocode coordinates to get an address
  app.get("/api/geocode/reverse", requireAuth, async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ 
          error: { code: "INVALID_REQUEST", message: "Valid lat and lng parameters required" } 
        });
      }

      const address = await reverseGeocode(lat, lng);
      
      if (!address) {
        return res.status(404).json({ 
          error: { code: "NOT_FOUND", message: "Address not found for coordinates" } 
        });
      }

      res.json({ address, lat, lng });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      res.status(500).json({ 
        error: { code: "GEOCODING_ERROR", message: "Failed to reverse geocode coordinates" } 
      });
    }
  });

  // DEBUG: Query HubSpot association types
  app.get("/api/debug/association-types", requireAuth, async (req, res) => {
    try {
      const axios = (await import('axios')).default;
      const apiKey = process.env.HUBSPOT_API_KEY;
      
      const url = 'https://api.hubapi.com/crm/v4/associations/2-175854274/0-2/labels';
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });
      
      res.json({ 
        success: true,
        associationTypes: response.data,
        note: "These are the available association type IDs between Check-Ins (2-175854274) and Companies (0-2)"
      });
    } catch (error: any) {
      console.error("Error fetching association types:", error?.response?.data || error.message);
      res.status(error?.response?.status || 500).json({ 
        error: { 
          code: "ASSOCIATION_QUERY_ERROR", 
          message: error.message,
          details: error?.response?.data 
        } 
      });
    }
  });

  // Get HubSpot owners (for admin setup)
  app.get("/api/hubspot/owners", requireAuth, async (req, res) => {
    try {
      const { fetchHubSpotOwners } = await import("./services/hubspot");
      const owners = await fetchHubSpotOwners();
      res.json({ owners });
    } catch (error) {
      console.error("Error fetching HubSpot owners:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch HubSpot owners" } });
    }
  });

  // ============================================================================
  // Route Planning Routes
  // ============================================================================

  // Build optimized route
  app.post("/api/route", requireAuth, async (req, res) => {
    try {
      const { buildRouteRequestSchema } = await import("@shared/schema");
      const request: BuildRouteRequest = buildRouteRequestSchema.parse(req.body);

      // Get company details for each ID
      const companies = await Promise.all(
        request.companyIds.map((id) => storage.getCompany(id))
      );

      // Filter out any missing companies
      const validCompanies = companies.filter((c) => c !== undefined && c.lat !== null && c.lng !== null);
      
      if (validCompanies.length < 2) {
        return res.status(400).json({ 
          error: { code: "INVALID_REQUEST", message: "Need at least 2 companies to build a route" } 
        });
      }

      // Build coordinates array as objects with lat/lng
      const coordinates = validCompanies.map((c) => ({ lat: c!.lat!, lng: c!.lng! }));

      // Get user's origin (current location or specified point)
      let origin: { lat: number; lng: number } | undefined;
      if (typeof request.origin === 'object' && 'lat' in request.origin && 'lng' in request.origin) {
        origin = request.origin;
      }
      // Note: if origin is "gps", we'll optimize without a fixed start (any starting point)

      // Optimize route using Mapbox with user's location as starting point
      const optimizedRoute = await optimizeRoute(coordinates, origin, request.customEndpoint);

      // Map optimized waypoints back to companies for API response
      const stopsForApi: RouteStopApi[] = optimizedRoute.waypoints.map((waypoint, index) => {
        const company = validCompanies[waypoint.waypointIndex];
        return {
          companyId: company!.id,
          name: company!.name,
          customerNumber: company!.customerNumber,
          lat: company!.lat!,
          lng: company!.lng!,
          distanceFromPrevMi: waypoint.distanceFromPrevMi,
          etaFromPrevMin: waypoint.etaFromPrevMin,
          completed: false,
          // Include full company details for map display
          street: company!.street,
          city: company!.city,
          state: company!.state,
          postalCode: company!.postalCode,
        };
      });

      // Create route in storage (keep JSONB for backward compatibility during migration)
      console.log('[Routes] Creating route with totalDistMi:', optimizedRoute.totalDistMi, 'totalEtaMin:', optimizedRoute.totalEtaMin);
      
      const route = await storage.createRoute({
        userId: (req as any).session.userId,
        stops: stopsForApi as any,
        totalDistanceMi: optimizedRoute.totalDistMi,
        totalEtaMin: Math.round(optimizedRoute.totalEtaMin), // Round to integer for database
        currentStopIndex: 0,
        status: "active", // Mark as active so GET /api/route/active can find it
        routeGeometry: optimizedRoute.routeGeometry as any, // Save full driving route path
        customEndpoint: optimizedRoute.customEndpoint as any, // Save custom endpoint location
        isTemplate: false, // This is an active route, not a template
      });
      
      // Create route_stops records for better analytics
      const routeStopsToCreate = stopsForApi.map((stop, index) => ({
        routeId: route.id,
        companyId: stop.companyId,
        stopIndex: index,
        name: stop.name,
        customerNumber: stop.customerNumber || null,
        lat: stop.lat,
        lng: stop.lng,
        street: stop.street || null,
        city: stop.city || null,
        state: stop.state || null,
        postalCode: stop.postalCode || null,
        distanceFromPrevMi: stop.distanceFromPrevMi || null,
        etaFromPrevMin: stop.etaFromPrevMin ? Math.round(stop.etaFromPrevMin) : null,
        completed: false,
      }));
      
      await storage.createRouteStops(routeStopsToCreate);
      
      console.log('[Routes] Created route with', routeStopsToCreate.length, 'stops in route_stops table');

      // Build Google Maps navigation URL
      const waypointsParam = stopsForApi
        .map((stop) => `${stop.lat},${stop.lng}`)
        .join("|");
      const navUrl = `https://www.google.com/maps/dir/?api=1&waypoints=${waypointsParam}&travelmode=driving`;

      // Return BuildRouteResponse format - use optimizedRoute values directly
      res.json({
        routeId: route.id,
        stops: stopsForApi,
        totalDistMi: optimizedRoute.totalDistMi,  // Use values from optimizedRoute, not storage
        totalEtaMin: optimizedRoute.totalEtaMin,
        navUrl,
        routeGeometry: optimizedRoute.routeGeometry,
        customEndpoint: optimizedRoute.customEndpoint,
      });
    } catch (error) {
      console.error("Route planning error:", error);
      res.status(500).json({ error: { code: "ROUTE_ERROR", message: "Failed to build route" } });
    }
  });

  // Update route order and recalculate
  app.patch("/api/routes/:id/stops", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { orderedStopIds, customEndpoint } = req.body;

      // Validate request
      if (!orderedStopIds || !Array.isArray(orderedStopIds)) {
        return res.status(400).json({ error: { code: "INVALID_REQUEST", message: "orderedStopIds array required" } });
      }

      // Get existing route
      const route = await storage.getRoute(id);
      if (!route) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
      }

      // Verify ownership
      if (route.userId !== (req as any).session.userId) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
      }

      // Get companies for the reordered IDs
      const companies = await Promise.all(
        orderedStopIds.map((companyId: string) => storage.getCompany(companyId))
      );

      const validCompanies = companies.filter((c) => c !== undefined && c.lat !== null && c.lng !== null);
      
      if (validCompanies.length < 2) {
        return res.status(400).json({ 
          error: { code: "INVALID_REQUEST", message: "Need at least 2 valid companies" } 
        });
      }

      // Build coordinates in new order - DON'T RE-OPTIMIZE, keep user's order
      const coordinates = validCompanies.map((c) => ({ lat: c!.lat!, lng: c!.lng! }));
      
      // Add custom endpoint if provided
      const allCoords = customEndpoint 
        ? [...coordinates, customEndpoint]
        : coordinates;

      // Call Mapbox directly to get distances for exact order (no optimization)
      const { getRoute } = await import("./services/mapbox");
      const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
      const MAPBOX_API = "https://api.mapbox.com";
      
      const coordsString = allCoords.map(c => `${c.lng},${c.lat}`).join(';');
      const url = `${MAPBOX_API}/directions/v5/mapbox/driving/${coordsString}`;
      
      const axios = (await import("axios")).default;
      const response = await axios.get(url, {
        params: {
          access_token: MAPBOX_TOKEN,
          geometries: 'geojson',
          overview: 'full',
          steps: false,
        },
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No route found');
      }

      const routeData = response.data.routes[0];
      const routeGeometry: Array<{ lat: number; lng: number }> = [];
      
      if (routeData.geometry && routeData.geometry.coordinates) {
        routeData.geometry.coordinates.forEach((coord: [number, number]) => {
          routeGeometry.push({ lng: coord[0], lat: coord[1] });
        });
      }

      const totalDistMi = routeData.distance ? routeData.distance * 0.000621371 : 0;
      const totalEtaMin = routeData.duration ? routeData.duration / 60 : 0;

      // Rebuild stops array with new metrics from route legs
      const stopsForApi: RouteStopApi[] = validCompanies.map((company, index) => {
        const leg = index > 0 ? routeData.legs?.[index - 1] : null;
        
        return {
          companyId: company!.id,
          name: company!.name,
          customerNumber: company!.customerNumber,
          lat: company!.lat!,
          lng: company!.lng!,
          distanceFromPrevMi: leg ? leg.distance * 0.000621371 : null,
          etaFromPrevMin: leg ? leg.duration / 60 : null,
          completed: false,
          street: company!.street,
          city: company!.city,
          state: company!.state,
          postalCode: company!.postalCode,
        };
      });

      // Update route in storage with new geometry and metrics
      await storage.updateRoute(id, {
        stops: stopsForApi as any,
        totalDistanceMi: totalDistMi,
        totalEtaMin: Math.round(totalEtaMin),
        routeGeometry: routeGeometry as any,
        customEndpoint: customEndpoint as any,
      });

      // Build navigation URL (include custom endpoint if provided)
      let waypointCoords = stopsForApi.map((stop) => `${stop.lat},${stop.lng}`);
      if (customEndpoint) {
        waypointCoords.push(`${customEndpoint.lat},${customEndpoint.lng}`);
      }
      const waypointsParam = waypointCoords.join("|");
      const navUrl = `https://www.google.com/maps/dir/?api=1&waypoints=${waypointsParam}&travelmode=driving`;

      // Return updated route
      res.json({
        routeId: id,
        stops: stopsForApi,
        totalDistMi: totalDistMi,
        totalEtaMin: totalEtaMin,
        navUrl,
        routeGeometry: routeGeometry,
        customEndpoint: customEndpoint,
      });
    } catch (error) {
      console.error("Route update error:", error);
      res.status(500).json({ error: { code: "UPDATE_ERROR", message: "Failed to update route" } });
    }
  });

  // Get route by ID
  app.get("/api/route/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const route = await storage.getRoute(id);
      
      if (!route) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
      }
      
      // Verify the route belongs to the current user
      if (route.userId !== (req as any).session.userId) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
      }
      
      // Get the stops with their completed status
      const stops = await storage.getRouteStops(id);
      
      res.json({
        ...route,
        stops
      });
    } catch (error) {
      console.error("Error fetching route:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch route" } });
    }
  });

  // Get active route
  app.get("/api/route/active", requireAuth, async (req, res) => {
    try {
      const route = await storage.getActiveRoute((req as any).session.userId);
      if (!route) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "No active route" } });
      }
      
      // Get the stops with their completed status
      const stops = await storage.getRouteStops(route.id);
      
      res.json({
        ...route,
        stops
      });
    } catch (error) {
      console.error("Error fetching active route:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch route" } });
    }
  });

  // Update route (mark stops complete, update status)
  app.patch("/api/route/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const route = await storage.updateRoute(id, updates);
      res.json(route);
    } catch (error) {
      console.error("Error updating route:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update route" } });
    }
  });

  // Get route history
  app.get("/api/routes/history", requireAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const routes = await storage.getRoutesByUser((req as any).session.userId, status);
      res.json({ routes });
    } catch (error) {
      console.error("Error fetching route history:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch routes" } });
    }
  });

  // Delete route
  app.delete("/api/route/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRoute(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to delete route" } });
    }
  });

  // ============================================================================
  // Saved Routes Endpoints
  // ============================================================================

  // Get all saved routes for the user
  app.get("/api/routes/saved", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const includeStops = req.query.includeStops === 'true';
      const savedRoutes = await storage.getSavedRoutes(userId);
      
      // Get stop data for each saved route
      const routesWithStops = await Promise.all(
        savedRoutes.map(async (route) => {
          const stops = await storage.getRouteStops(route.id);
          
          if (includeStops && stops.length > 0) {
            // Fetch company details for each stop
            const stopsWithCompanies = await Promise.all(
              stops.map(async (stop) => {
                const company = await storage.getCompany(stop.companyId);
                return {
                  id: stop.id,
                  companyId: stop.companyId,
                  companyName: company?.name || "Unknown Company",
                  address: company?.street || null,
                  city: company?.city || null,
                  state: company?.state || null,
                  stopIndex: stop.stopIndex,
                  distanceFromPrevMi: stop.distanceFromPrevMi,
                  etaFromPrevMin: stop.etaFromPrevMin
                };
              })
            );
            
            return {
              ...route,
              stopCount: stops.length,
              stops: stopsWithCompanies
            };
          }
          
          return {
            ...route,
            stopCount: stops.length
          };
        })
      );
      
      res.json({ routes: routesWithStops });
    } catch (error) {
      console.error("Error fetching saved routes:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch saved routes" } });
    }
  });

  // Save a new route template
  app.post("/api/routes/saved", requireAuth, async (req, res) => {
    try {
      const { createSavedRouteSchema } = await import("@shared/schema");
      const userId = (req as any).session.userId;
      
      // Validate request body
      const validatedData = createSavedRouteSchema.parse(req.body);
      
      const savedRoute = await storage.createSavedRoute(userId, validatedData.templateName, validatedData.routeData);
      res.json(savedRoute);
    } catch (error) {
      console.error("Error saving route:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to save route" } });
    }
  });

  // Update a saved route (rename)
  app.patch("/api/routes/saved/:id", requireAuth, async (req, res) => {
    try {
      const { updateSavedRouteSchema } = await import("@shared/schema");
      const userId = (req as any).session.userId;
      const { id } = req.params;
      
      // Validate request body
      const validatedData = updateSavedRouteSchema.parse(req.body);
      
      const updatedRoute = await storage.updateSavedRoute(userId, id, { templateName: validatedData.templateName });
      res.json(updatedRoute);
    } catch (error) {
      console.error("Error updating saved route:", error);
      if ((error as any).message === "Saved route not found or access denied") {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "Saved route not found or access denied" } });
      } else {
        res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update saved route" } });
      }
    }
  });

  // Delete a saved route
  app.delete("/api/routes/saved/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const { id } = req.params;
      
      await storage.deleteSavedRoute(userId, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting saved route:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to delete saved route" } });
    }
  });

  // Build a new active route from a saved route
  app.post("/api/routes/saved/:id/build", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const { id } = req.params;
      
      const newRoute = await storage.buildRouteFromSaved(userId, id);
      
      // Get the stops for the new route
      const stops = await storage.getRouteStops(newRoute.id);
      
      res.json({
        ...newRoute,
        stops
      });
    } catch (error) {
      console.error("Error building route from saved:", error);
      if ((error as any).message === "Saved route not found or access denied") {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "Saved route not found or access denied" } });
      } else {
        res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to build route from saved" } });
      }
    }
  });

  // ============================================================================
  // AI Voice-to-Text Routes
  // ============================================================================

  // Transcribe audio and extract structured data
  app.post("/api/transcribe", requireAuth, async (req, res) => {
    try {
      const { transcribeRequestSchema } = await import("@shared/schema");
      const { transcribeAndParse } = await import("./services/ai");
      
      const { audioData, mimeType } = transcribeRequestSchema.parse(req.body);
      
      console.log(`🎤 Processing audio transcription (${mimeType})`);
      
      const result = await transcribeAndParse(audioData, mimeType);
      
      res.json(result);
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ 
        error: { 
          code: "TRANSCRIPTION_ERROR", 
          message: error instanceof Error ? error.message : "Failed to transcribe audio" 
        } 
      });
    }
  });

  // ============================================================================
  // Check-In Routes
  // ============================================================================

  // Create check-in
  app.post("/api/checkins", requireAuth, async (req, res) => {
    try {
      const { checkInRequestSchema } = await import("@shared/schema");
      const checkInData: CheckInRequest = checkInRequestSchema.parse(req.body);

      // Get company details
      const company = await storage.getCompany(checkInData.companyId);
      if (!company) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Company not found" } });
      }

      // Get user details
      const user = await storage.getUser((req as any).session.userId);
      if (!user) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
      }

      // Create local check-in record with structured visit data
      const checkIn = await storage.createCheckIn({
        userId: (req as any).session.userId,
        companyId: checkInData.companyId,
        lat: checkInData.lat,
        lng: checkInData.lng,
        note: checkInData.note || undefined,
        voiceTranscript: checkInData.voiceTranscript || undefined,
        machineryTypes: checkInData.machineryTypes || undefined,
        engineTypes: checkInData.engineTypes || undefined,
        fleetMakeup: checkInData.fleetMakeup || undefined,
        currentSuppliers: checkInData.currentSuppliers || undefined,
        competitorData: checkInData.competitorData || undefined,
        pricingInfo: checkInData.pricingInfo || undefined,
        productModels: checkInData.productModels || undefined,
        availabilityGaps: checkInData.availabilityGaps || undefined,
        customerNeeds: checkInData.customerNeeds || undefined,
        competitivePosition: checkInData.competitivePosition || undefined,
        insideSalesIssues: checkInData.insideSalesIssues || undefined,
        nextSteps: checkInData.nextSteps || undefined,
        miscNotes: checkInData.miscNotes || undefined,
        visitDurationMin: checkInData.visitDurationMin || undefined,
      });
      
      // Update with submission timestamp
      await storage.updateCheckIn(checkIn.id, { submittedAt: new Date() });

      // Mark route_stop as completed if there's an active route
      const activeRoute = await storage.getActiveRoute((req as any).session.userId);
      if (activeRoute) {
        const routeStops = await storage.getRouteStops(activeRoute.id);
        const stopToComplete = routeStops.find(s => s.companyId === checkInData.companyId && !s.completed);
        if (stopToComplete) {
          await storage.updateRouteStop(stopToComplete.id, { 
            completed: true,
            completedAt: new Date()
          });
          console.log(`✅ Marked route_stop ${stopToComplete.id} as completed for company ${checkInData.companyId}`);
          
          // Check if all stops are now completed and mark route as completed
          const allStops = await storage.getRouteStops(activeRoute.id);
          const allCompleted = allStops.every(s => s.completed);
          if (allCompleted) {
            await storage.updateRoute(activeRoute.id, {
              status: "completed",
              completedAt: new Date()
            });
            console.log(`✅ All stops completed, marked route ${activeRoute.id} as completed`);
          }
        }
      }

      // Create HubSpot field visit record (async, don't block response)
      createFieldVisitCheckIn(
        company.id,
        company.name,
        user.id,
        user.username,
        checkInData.lat,
        checkInData.lng,
        checkInData.note || null,
        checkIn.timestamp.toISOString(),
        {
          voiceTranscript: checkInData.voiceTranscript || null,
          machineryTypes: checkInData.machineryTypes || null,
          engineTypes: checkInData.engineTypes || null,
          fleetMakeup: checkInData.fleetMakeup || null,
          currentSuppliers: checkInData.currentSuppliers || null,
          competitorData: checkInData.competitorData || null,
          pricingInfo: checkInData.pricingInfo || null,
          productModels: checkInData.productModels || null,
          availabilityGaps: checkInData.availabilityGaps || null,
          customerNeeds: checkInData.customerNeeds || null,
          competitivePosition: checkInData.competitivePosition || null,
          insideSalesIssues: checkInData.insideSalesIssues || null,
          nextSteps: checkInData.nextSteps || null,
          miscNotes: checkInData.miscNotes || null,
          visitDurationMin: checkInData.visitDurationMin || null,
        }
      )
        .then((recordId) => {
          // Update check-in with HubSpot record ID
          storage.updateCheckIn(checkIn.id, { hubspotNoteId: recordId });
          console.log(`✅ Created HubSpot field visit ${recordId} for check-in ${checkIn.id}`);
        })
        .catch((err) => {
          console.error("Failed to create HubSpot field visit:", err);
        });

      res.json(checkIn);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create check-in" } });
    }
  });

  // Update check-in (edit notes)
  app.patch("/api/checkins/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      const checkIn = await storage.updateCheckIn(id, { note });
      res.json(checkIn);
    } catch (error) {
      console.error("Error updating check-in:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update check-in" } });
    }
  });

  // ============================================================================
  // Summary Routes
  // ============================================================================

  // Get daily summary
  app.get("/api/summary", requireAuth, async (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split("T")[0];
      
      const checkIns = await storage.getCheckInsByDate((req as any).session.userId, date);

      // Calculate stats
      const totalVisits = checkIns.length;
      let totalMiles = 0;

      // Calculate mileage between check-ins
      for (let i = 1; i < checkIns.length; i++) {
        const prev = checkIns[i - 1];
        const curr = checkIns[i];
        totalMiles += calculateDistanceMiles(prev.lat, prev.lng, curr.lat, curr.lng);
      }

      // Get company details for each check-in
      const checkInsWithCompanies = await Promise.all(
        checkIns.map(async (checkIn) => {
          const company = await storage.getCompany(checkIn.companyId);
          return {
            ...checkIn,
            companyName: company?.name || "Unknown",
          };
        })
      );

      res.json({
        date,
        totalVisits,
        totalMiles: Math.round(totalMiles * 10) / 10,
        checkIns: checkInsWithCompanies,
      });
    } catch (error) {
      console.error("Summary error:", error);
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to fetch summary" } });
    }
  });

  // ============================================================================
  // Admin Routes - Owner management (temporary until proper UI is built)
  // ============================================================================

  // Get HubSpot owners for user mapping
  app.get("/api/admin/hubspot-owners", requireAuth, async (req, res) => {
    try {
      const { fetchHubSpotOwners } = await import("./services/hubspot");
      const owners = await fetchHubSpotOwners();
      res.json({ owners });
    } catch (error: any) {
      console.error("Error fetching HubSpot owners:", error);
      res.status(500).json({ 
        error: { code: "SERVER_ERROR", message: "Failed to fetch HubSpot owners" } 
      });
    }
  });

  // Update user's HubSpot owner ID (restricted to own account, one-time setup)
  app.post("/api/admin/set-owner", requireAuth, async (req, res) => {
    try {
      const { ownerId } = req.body;
      const sessionUserId = (req as any).session.userId;
      
      // Get current user to check if owner ID is already set
      const currentUser = await storage.getUser(sessionUserId);
      if (!currentUser) {
        return res.status(404).json({ 
          error: { code: "NOT_FOUND", message: "User not found" } 
        });
      }
      
      // Security: Prevent changing owner ID after initial setup
      // This prevents privilege escalation by impersonating other owners
      if (currentUser.hubspotOwnerId && currentUser.hubspotOwnerId !== ownerId) {
        return res.status(403).json({ 
          error: { 
            code: "FORBIDDEN", 
            message: "Owner ID already set. Contact administrator to change." 
          } 
        });
      }
      
      // Validate that ownerId exists in HubSpot
      const { fetchHubSpotOwners } = await import("./services/hubspot");
      const owners = await fetchHubSpotOwners();
      const validOwner = owners.find((o: any) => o.id === ownerId);
      
      if (!validOwner) {
        return res.status(400).json({ 
          error: { 
            code: "INVALID_OWNER", 
            message: "Invalid HubSpot owner ID" 
          } 
        });
      }
      
      // Update user with validated owner ID
      const updatedUser = await storage.updateUser(sessionUserId, { hubspotOwnerId: ownerId });
      
      res.json({ 
        success: true, 
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          hubspotOwnerId: updatedUser.hubspotOwnerId,
        }
      });
    } catch (error: any) {
      console.error("Error updating owner ID:", error);
      res.status(500).json({ 
        error: { code: "SERVER_ERROR", message: "Failed to update owner ID" } 
      });
    }
  });

  const httpServer = createServer(app);
  
  // Configure timeouts for long audio processing (10 minutes)
  httpServer.requestTimeout = 600000; // 10 minutes
  httpServer.timeout = 600000; // socket inactivity timeout
  httpServer.headersTimeout = 610000; // slightly higher than requestTimeout
  
  return httpServer;
}
