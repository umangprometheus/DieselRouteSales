# MSP Diesel Field Sales Route App

## Overview

A mobile-first field service application for diesel sales representatives to plan daily routes, navigate to customer locations, and check in at company sites. The application integrates with HubSpot CRM for company data management and uses Mapbox for geocoding and route optimization. Built for outdoor use with emphasis on readability and GPS-based proximity detection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server

**Routing**: Wouter for lightweight client-side routing with protected routes requiring authentication

**UI Component System**: Shadcn UI (Radix UI primitives) + Tailwind CSS
- Mobile-first design optimized for outdoor field use (360-428px phones)
- System font stack for performance
- Minimal spacing primitives (2, 3, 4, 6, 8 units)
- Design inspired by Google Maps navigation UI and Linear's clean aesthetics

**State Management**:
- TanStack Query (React Query) for server state with aggressive caching
- LocalStorage for active route persistence across page refreshes
- React Context for authentication state

**Key Design Decisions**:
- Bottom navigation pattern for mobile-first UX
- Fixed bottom sheets for interactive overlays
- Touch-optimized with 800-foot proximity threshold for check-ins
- Outdoor-readable typography (minimum 16px body text)

### Backend Architecture

**Runtime**: Node.js with Express.js framework using ES modules

**API Design**: RESTful JSON API with session-based authentication
- Cookie-based sessions with httpOnly and secure flags
- Password hashing with bcrypt (10 salt rounds)
- Middleware-based auth protection for routes

**Database Layer**:
- Drizzle ORM for type-safe database queries
- Neon serverless PostgreSQL via WebSocket connection
- Schema-first design with TypeScript inference

**Key Services**:
- Storage service: Abstracted data access layer with CRUD operations for all entities
- Auth service: Password hashing and verification
- Geo service: Distance calculations using Turf.js (Haversine formula)
- Sync service: Periodic HubSpot company data synchronization with geocoding
- MapBox service: Address geocoding and route optimization

**Data Models**:
- Users: Username/password auth with HubSpot owner ID mapping
- Companies: Cached HubSpot data with geocoded lat/lng coordinates
- Routes: Active/completed routes with status tracking
- RouteStops: Ordered waypoints with check-in status
- CheckIns: GPS-stamped visit records with notes
- SyncLogs: Audit trail for HubSpot synchronization

### Authentication & Authorization

**Strategy**: Session-based authentication with secure cookie storage
- Login endpoint validates credentials and creates session
- Session middleware checks authentication on protected routes
- User-to-HubSpot owner mapping filters company visibility

**Security Measures**:
- Passwords hashed with bcrypt before storage
- Session secret from environment variables
- Secure cookies in production, lax SameSite policy
- 7-day session expiration

### Route Planning & Navigation

**Route Building Algorithm**:
1. Filter companies by radius from starting location
2. User selects companies to visit
3. Nearest-neighbor greedy algorithm orders stops
4. Mapbox Directions API calculates optimized driving route
5. Route geometry and ETA stored for navigation

**GPS Proximity Detection**:
- Continuous location tracking during active route
- 800-foot (~243 meters) proximity threshold triggers check-in prompt
- Distance calculations using Turf.js distance function
- Supports both planned stops and opportunistic nearby check-ins

**Navigation Integration**:
- Deep links to native Google Maps/Apple Maps apps
- Route geometry displayed on embedded Mapbox GL map
- Real-time user location marker with heading indicator

### Data Synchronization

**HubSpot Integration**:
- Private App API key authentication (@hubspot/api-client)
- Periodic full sync of company records
- Geocoding of new/updated addresses via Mapbox
- Soft-delete pattern for removed companies
- Rate limiting: 150ms delay between geocoding requests
- Check-ins create custom object records (ID: 2-175854274) with associations to companies

**HubSpot Custom Object Associations (Critical Implementation Notes)**:
- Custom object type ID: `2-175854274` (Check-Ins)
- Company object type ID: `0-2` (standard HubSpot companies)
- Association type ID: **73** (account-specific, must query via API)
- Association category: `USER_DEFINED` (for custom objects)
- Association must be defined in HubSpot UI first (Settings → Objects → Check-Ins → Associations)
- API endpoint: `PUT /crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/{toObjectType}/{toObjectId}`
- Request payload: `[{ "associationCategory": "USER_DEFINED", "associationTypeId": 73 }]`
- Demo companies (IDs starting with "demo-") are skipped for associations (don't exist in HubSpot)
- Query available association types: `GET /crm/v4/associations/{fromObjectType}/{toObjectType}/labels`

**Sync Strategy**:
- Manual trigger via UI sync button
- Periodic background sync (configurable interval)
- Upsert pattern: Create new or update existing by HubSpot ID
- Preserves existing geocoded coordinates to avoid API waste

### Map Rendering

**Technology**: Mapbox GL JS with interactive markers
- User location marker (blue dot with heading)
- Company markers (color-coded: green for selected, orange for available)
- Route polyline overlay showing optimized driving path
- Click handlers for company selection and info display

**Performance Optimizations**:
- Lazy map initialization only when needed
- Marker clustering disabled for clarity in field use
- Debounced location updates to reduce re-renders

## External Dependencies

### Third-Party APIs

**HubSpot CRM API**:
- Purpose: Source of truth for company/customer data
- Authentication: Private App access token
- Operations: Fetch companies with pagination, filter by owner
- Rate limits: Standard HubSpot API limits apply

**Mapbox APIs**:
- Geocoding API: Convert addresses to lat/lng coordinates
- Directions API: Calculate optimized multi-stop routes with turn-by-turn geometry
- Mapbox GL JS: Client-side map rendering
- Authentication: Access token (must be duplicated as VITE_MAPBOX_TOKEN for client)
- Rate limits: Geocoding requests throttled to 150ms intervals

### Database

**Neon Serverless PostgreSQL**:
- Connection: WebSocket-based via @neondatabase/serverless
- Connection pooling with Pool client
- Requires DATABASE_URL environment variable
- Schema managed via Drizzle migrations

### Key NPM Dependencies

**Backend**:
- `express`: Web framework
- `drizzle-orm`: Type-safe ORM
- `@hubspot/api-client`: HubSpot SDK
- `bcryptjs`: Password hashing
- `cookie-session`: Session management
- `axios`: HTTP client for external APIs
- `@turf/turf`: Geospatial calculations

**Frontend**:
- `react` + `react-dom`: UI framework
- `@tanstack/react-query`: Server state management
- `wouter`: Routing
- `mapbox-gl`: Interactive maps
- `@radix-ui/*`: Headless UI primitives
- `tailwindcss`: Utility-first CSS
- `react-hook-form` + `zod`: Form validation

### Environment Configuration

**Required Secrets**:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `HUBSPOT_API_KEY`: HubSpot Private App token
- `MAPBOX_TOKEN`: Mapbox API access token (server-side)
- `VITE_MAPBOX_TOKEN`: Mapbox access token (client-side, must duplicate MAPBOX_TOKEN)
- `SESSION_SECRET`: Cookie session encryption key

**Build Configuration**:
- TypeScript with strict mode enabled
- Vite bundler with React plugin
- ESBuild for server bundling in production
- Path aliases: `@/` (client), `@shared/` (shared types)