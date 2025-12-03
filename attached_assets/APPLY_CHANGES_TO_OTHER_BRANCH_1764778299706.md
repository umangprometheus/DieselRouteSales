# Apply All Changes to Other Branch

## Instructions for Replit AI

Please make the following changes to add the Mapbox runtime token fix and related updates:

---

## CHANGE 1: Update `server/routes.ts`

Add this endpoint inside the `registerRoutes` function, right after the function declaration line:

```typescript
  // ============================================================================
  // Config Endpoint - Serves Mapbox token at RUNTIME
  // ============================================================================
  // This serves the token at RUNTIME instead of embedding at build time
  // This ensures the map works regardless of how the app is built/deployed
  app.get("/api/config", (req, res) => {
    res.json({
      mapboxToken: process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || "",
    });
  });
```

---

## CHANGE 2: Update `client/src/components/map-view.tsx`

### 2A. Add comment at top of file (after imports):
```typescript
// Mapbox token will be fetched at runtime from /api/config
// This ensures the token works regardless of how the app is built
```

### 2B. Add state variable inside the component (near other useState calls):
```typescript
const [tokenLoaded, setTokenLoaded] = useState(false);
```

### 2C. Add this useEffect BEFORE the map initialization useEffect:
```typescript
// Fetch Mapbox token from server at runtime (not build time)
useEffect(() => {
  async function fetchMapboxToken() {
    try {
      // First try to use build-time token (for backwards compatibility)
      const buildTimeToken = import.meta.env.VITE_MAPBOX_TOKEN;
      if (buildTimeToken) {
        console.log("[MapView] Using build-time token (length:", buildTimeToken.length + ")");
        mapboxgl.accessToken = buildTimeToken;
        setTokenLoaded(true);
        return;
      }

      // Fetch token from server at runtime
      console.log("[MapView] Fetching token from /api/config...");
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error("Failed to fetch config");
      }
      const config = await response.json();
      
      if (config.mapboxToken) {
        console.log("[MapView] Runtime token loaded (length:", config.mapboxToken.length + ")");
        mapboxgl.accessToken = config.mapboxToken;
        setTokenLoaded(true);
      } else {
        console.error("[MapView] No Mapbox token in server config");
        setMapError("Mapbox token not configured on server");
      }
    } catch (error) {
      console.error("[MapView] Failed to fetch Mapbox token:", error);
      setMapError("Failed to load map configuration");
    }
  }
  
  fetchMapboxToken();
}, []);
```

### 2D. Update the map initialization useEffect:

Change the guard clause from:
```typescript
if (!mapContainer.current || map.current) return;
```

To:
```typescript
if (!mapContainer.current || map.current || !tokenLoaded) return;
```

And change the dependency array at the end from `[]` to `[tokenLoaded]`

### 2E. Update user location marker to yellow color:

Find the line that creates the user marker element and change it to use yellow:
```typescript
el.className = "w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow-lg animate-pulse";
```

---

## CHANGE 3: Create new file `ecosystem.config.mjs`

Create this file in the project root:

```javascript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

export default {
  apps: [{
    name: 'msp-diesel-routes',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 5000,
      DATABASE_URL: process.env.DATABASE_URL,
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      PGUSER: process.env.PGUSER,
      PGPASSWORD: process.env.PGPASSWORD,
      PGDATABASE: process.env.PGDATABASE,
      DB_SSL: process.env.DB_SSL,
      HUBSPOT_API_KEY: process.env.HUBSPOT_API_KEY,
      MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
      VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN,
      SESSION_SECRET: process.env.SESSION_SECRET,
      COOKIE_SECURE: process.env.COOKIE_SECURE,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    restart_delay: 4000,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: 5000,
    merge_logs: true,
    kill_timeout: 5000
  }]
};
```

---

## CHANGE 4: Update `.env` file

Make sure the `.env` file has this line:

```
MAPBOX_TOKEN=pk.eyJ1IjoiYWhkYXZpZHMiLCJhIjoiY21nczZ6aHUwMmh0bTJrcHk2NWh2ZnRmYiJ9.Gn3VepWmqmAyroB6mhwutg
```

---

## CHANGE 5: Update `replit.md` (documentation)

Add this section under "### Map Rendering":

```markdown
**Runtime Token Loading**: The Mapbox token is fetched at runtime from `/api/config` endpoint instead of being embedded at build time. This ensures the map works regardless of how the application is built or restarted. The frontend tries build-time `VITE_MAPBOX_TOKEN` first (for backwards compatibility), then falls back to fetching from the server. For VM deployments, only `MAPBOX_TOKEN` in the `.env` file is required.
```

Update the "### Environment Configuration" section to:

```markdown
### Environment Configuration

Required environment variables:
-   `DATABASE_URL`: PostgreSQL connection string
-   `MAPBOX_TOKEN`: Mapbox API token (served at runtime via `/api/config`)
-   `SESSION_SECRET`: Secret key for cookie encryption

Optional environment variables:
-   `HUBSPOT_API_KEY`: For HubSpot CRM sync (app works without this)
-   `VITE_MAPBOX_TOKEN`: Legacy build-time token (not needed if `MAPBOX_TOKEN` is set)
-   `COOKIE_SECURE`: Set to `false` for HTTP deployments
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `server/routes.ts` | Add `/api/config` endpoint |
| `client/src/components/map-view.tsx` | Add runtime token fetching, yellow user marker |
| `ecosystem.config.mjs` | Create new file for PM2 |
| `.env` | Add `MAPBOX_TOKEN` |
| `replit.md` | Update documentation |

---

## Why These Changes?

Previously, the Mapbox token was embedded at BUILD time. If you rebuilt without exporting env vars, the token disappeared and the map broke.

Now, the token is loaded at RUNTIME from the server. The server reads `MAPBOX_TOKEN` from `.env` and serves it via `/api/config`. This means:
- Map works after PM2 restarts
- No need to export env vars before building
- Token changes only require `.env` update and PM2 restart
