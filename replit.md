# MSP Diesel Field Sales Route App

## Overview

A mobile-first field service application for diesel sales representatives to plan daily routes, navigate to customer locations, and check in at company sites with AI-powered voice-to-text data collection. The application integrates with HubSpot CRM for company data management, uses Mapbox for geocoding and route optimization, and leverages Gemini AI for intelligent transcription and structured data extraction from field visit voice notes. Built for outdoor use with emphasis on readability and GPS-based proximity detection.

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
- Full-screen overlay pattern for route editing (replaces drawer to solve nested scroll issues)
- Touch-optimized drag-and-drop with entire card as grab area
- Body scroll locking during route editing to prevent viewport movement
- Touch-optimized with 800-foot proximity threshold for check-ins
- Outdoor-readable typography (minimum 16px body text)
- Toast notifications auto-dismiss after 1 second to prevent content obstruction
- History page uses accordion pattern for route selection (collapsible route entries)
- Summary page displays two key metrics: Total Stops Completed and Total Distance
- Application header displays "MSP" branding (not "Plan Route")
- Company cards in list view are fully clickable for selection (not just checkbox area)
- Clear Selection button only appears on map view, not in list view sticky header
- Distance displayed in US units: miles for >0.5mi, feet for <0.5mi

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
- AI service: Gemini-powered speech-to-text transcription and structured visit data parsing

**Data Models**:
- Users: Username/password auth with HubSpot owner ID mapping
- HubSpotOwners: Cached HubSpot owner metadata (id, email, name) for user mapping (schema exists, sync pending)
- Companies: Cached HubSpot data with geocoded lat/lng coordinates
- Routes: Active/completed routes with status tracking
- RouteStops: Ordered waypoints with check-in status
- CheckIns: GPS-stamped visit records with comprehensive structured visit data (15+ fields including machinery types, engine types, fleet makeup, suppliers, competitor data, customer needs, next steps, voice transcripts, visit duration)
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

**HubSpot Owner Mapping (Multi-User Scalability)**:
- **Current Implementation**: Admin-provisioned owner mapping model
  - Each user has `hubspotOwnerId` field mapping to HubSpot CRM owner
  - Admin manually assigns users to owner IDs (via SQL or admin endpoint)
  - Users cannot self-assign or change their owner ID
- **Company Visibility**: Tiered filtering with mandatory owner assignment
  - Users with owner ID see: their assigned companies + unassigned companies (NULL owner_id)
  - Users without owner ID: 403 FORBIDDEN - must contact administrator for provisioning
  - No users can access data without admin-assigned hubspotOwnerId
- **Owner Management**: Admin-only via SQL for security
  - SQL command: `UPDATE users SET hubspot_owner_id = 'OWNER_ID' WHERE username = 'USERNAME';`
  - Query HubSpot owners via `fetchHubSpotOwners()` service to find owner IDs
  - No API endpoints exposed to prevent privilege escalation
- **Adding New Users**:
  1. Admin creates user account or user self-registers
  2. Admin asks AI agent to query HubSpot owners using `fetchHubSpotOwners()` service
  3. Admin tells AI agent to assign owner ID via SQL: `UPDATE users SET hubspot_owner_id = 'X' WHERE username = 'Y'`
  4. User immediately sees their assigned + unassigned companies
- **Future Enhancements** (not yet implemented):
  - `hubspotOwners` table sync from HubSpot CRM Owners API
  - Role-based access control (admin vs. user permissions)
  - Admin UI for managing user-to-owner mappings
  - Multi-owner support for team managers
  - Delta sync for owner reassignments in HubSpot

### Route Planning & Navigation

**Route Building Algorithm**:
1. Filter companies by radius from starting location
2. User selects companies to visit
3. User optionally selects custom endpoint (any address via Mapbox geocoding)
4. Endpoint-aware greedy algorithm orders stops:
   - Without endpoint: Nearest-neighbor optimization from origin
   - With endpoint: Identifies stop closest to endpoint as final stop, then optimizes remaining stops from origin to reach it
5. Mapbox Directions API calculates optimized driving route with custom endpoint as final destination
6. Route geometry and ETA stored for navigation

**Route Editing Experience**:
- Full-screen overlay (RouteReorderView) for drag-and-drop stop reordering
- CSS-only body scroll lock prevents viewport movement without blocking touch events
- Touch-optimized with fast long-press activation (100ms delay for responsive feel)
- Enhanced drag overlay shows actual content being dragged with visual feedback
- Variable-speed auto-scroll based on proximity to edges for smooth dragging
- Three key actions:
  - **Add Stops**: Returns to plan page to select additional companies
  - **Cancel**: Discards edits and closes editor
  - **Build Route**: Saves edited route and navigates to active route page
- Custom endpoint (last stop) is locked and cannot be reordered
- Mobile bottom action bar auto-hides during overlay display to prevent z-index conflicts

**GPS Proximity Detection**:
- Continuous location tracking during active route
- 800-foot (~243 meters) proximity threshold triggers check-in prompt
- Distance calculations using Turf.js distance function
- Supports both planned stops and opportunistic nearby check-ins

**Navigation Integration**:
- Deep links to native Google Maps/Apple Maps apps
- Route geometry displayed on embedded Mapbox GL map
- Real-time user location marker with heading indicator

### AI-Powered Check-In Flow

**Voice-to-Text Data Collection**:
- Browser-based audio recording using MediaRecorder API (WebM format)
- Gemini AI (gemini-2.5-flash) transcribes voice notes to text
- Intelligent parsing extracts 15+ structured fields from unstructured speech
- Three-tab interface: Voice Recording, AI Review/Edit, Manual Entry
- Visit duration automatically calculated (check-in to submission timestamp)

**Structured Visit Data Fields**:
- **Required**: Machinery types, engine types, current suppliers, customer needs, next steps
- **Optional**: Fleet makeup, competitor data, pricing info, product models, availability gaps, competitive position, inside sales issues, misc notes
- **Auto-captured**: Voice transcript, visit duration (minutes), GPS coordinates, timestamp

**AI Parsing Strategy**:
- JSON schema-based extraction ensures consistent field structure
- Handles industry-specific terminology (CAT, Cummins, Bosch, etc.)
- Extracts pricing information and competitor intelligence
- Identifies follow-up actions for next_steps field

**User Experience Flow**:
1. Proximity alert triggers when within 800 feet of customer
2. User taps "Check In" → navigates to /check-in/submit page
3. Records voice note describing visit observations
4. AI transcribes and parses into structured fields
5. User reviews/edits extracted data in form
6. Submits → saves to database + syncs to HubSpot
7. Redirects back to route with success confirmation

### Data Synchronization

**HubSpot Integration**:
- Private App API key authentication (@hubspot/api-client)
- Periodic full sync of company records
- Geocoding of new/updated addresses via Mapbox
- Soft-delete pattern for removed companies
- Rate limiting: 150ms delay between geocoding requests
- Check-ins create custom object records (ID: 2-175854274) with all structured visit data
- Graceful fallback to Note creation if custom properties aren't configured (see HUBSPOT_SETUP.md)

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
- `@google/genai`: Gemini AI SDK for speech-to-text and data parsing
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