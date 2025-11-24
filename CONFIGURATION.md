# MSP Field Service App - Configuration Reference

This document lists all required configuration variables for the application. **Actual values are stored securely as environment variables/secrets**, never in code.

---

## Required Environment Variables

### Database Configuration

#### `DATABASE_URL` (Secret)
- **Type**: PostgreSQL connection string
- **Format**: `postgresql://username:password@host/database?sslmode=require`
- **Purpose**: Neon serverless PostgreSQL database connection
- **Used By**: Backend ORM (Drizzle), all database operations
- **Location**: Stored as Replit Secret

---

### External API Keys

#### `HUBSPOT_API_KEY` (Secret)
- **Type**: Private App Access Token
- **Format**: `pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Purpose**: HubSpot CRM API access for company data sync
- **Scope Required**:
  - `crm.objects.companies.read`
  - `crm.objects.companies.write`
  - `crm.objects.custom.read` (for Check-Ins custom object)
  - `crm.objects.custom.write` (for Check-Ins custom object)
- **Used By**: 
  - Company sync service
  - Check-in HubSpot submission
  - Owner data fetching
- **Location**: Stored as Replit Secret
- **Get It**: HubSpot → Settings → Integrations → Private Apps

---

#### `MAPBOX_TOKEN` (Secret)
- **Type**: Public/Secret Access Token
- **Format**: `pk.ey...` (public) or `sk.ey...` (secret)
- **Purpose**: Mapbox API for geocoding and routing
- **Scope Required**:
  - Geocoding API access
  - Directions API access
- **Used By**:
  - Server-side geocoding (address → lat/lng)
  - Route optimization (multi-stop directions)
  - Distance calculations
- **Location**: Stored as Replit Secret
- **Get It**: Mapbox → Account → Access Tokens
- **Note**: Must also set `VITE_MAPBOX_TOKEN` for client-side map rendering

---

#### `VITE_MAPBOX_TOKEN` (Environment Variable)
- **Type**: Mapbox Public Access Token
- **Format**: `pk.ey...` (must be public token, not secret)
- **Purpose**: Client-side Mapbox GL JS map rendering
- **Used By**: 
  - Interactive map display (MapView component)
  - Route geometry visualization
  - User location marker
- **Location**: Stored as Replit Environment Variable (shared)
- **Security Note**: This is intentionally exposed to the frontend - use a PUBLIC token with restricted scopes
- **Get It**: Same as `MAPBOX_TOKEN` but ensure it's a public token (pk. prefix)

---

#### `GEMINI_API_KEY` (Secret)
- **Type**: Google Gemini AI API Key
- **Format**: `AIza...`
- **Purpose**: Voice-to-text transcription and structured data extraction
- **Model Used**: `gemini-2.0-flash-exp`
- **Used By**:
  - Check-in voice note transcription
  - AI-powered field data parsing
- **Location**: Stored as Replit Secret
- **Get It**: Google AI Studio → Get API Key

---

### Session Security

#### `SESSION_SECRET` (Secret)
- **Type**: Random string (minimum 32 characters)
- **Format**: Any secure random string
- **Purpose**: Cookie session encryption for user authentication
- **Security**: Should be cryptographically random
- **Used By**: Express session middleware
- **Location**: Stored as Replit Secret
- **Generate**: `openssl rand -base64 32` or use password generator

---

## Environment Variable Scopes

### Secrets (Encrypted Storage)
All API keys and sensitive credentials:
- `DATABASE_URL`
- `HUBSPOT_API_KEY`
- `MAPBOX_TOKEN`
- `GEMINI_API_KEY`
- `SESSION_SECRET`

**Access**: Server-side only, never exposed to client

### Shared Environment Variables
Configuration that can be public:
- `VITE_MAPBOX_TOKEN` - Public Mapbox token for frontend
- `NODE_ENV` - Environment indicator (production/development)

**Access**: Available to both client and server

---

## How to View/Set Variables in Replit

### Via Replit UI
1. Click **Secrets** tab (lock icon) in left sidebar
2. Add/edit secret key-value pairs
3. Secrets are encrypted and never exposed in code

### Via Replit Agent (Preferred)
```
"Can you check which environment variables are configured?"
"Please add MAPBOX_TOKEN as a secret"
"Show me the value of DATABASE_URL"
```

### Via Code (Read Only)
```typescript
// Server-side (secrets accessible)
process.env.HUBSPOT_API_KEY
process.env.DATABASE_URL

// Client-side (only VITE_ prefixed)
import.meta.env.VITE_MAPBOX_TOKEN
```

---

## Security Best Practices

### ✅ DO:
- Store all API keys as Replit Secrets
- Use `VITE_` prefix for client-accessible variables
- Rotate secrets regularly
- Use public Mapbox tokens for frontend
- Keep `SESSION_SECRET` cryptographically random

### ❌ DON'T:
- Commit secrets to Git/version control
- Share secrets in documentation files
- Use secret Mapbox tokens (`sk.`) in frontend
- Hardcode API keys in code
- Use weak session secrets

---

## API Rate Limits & Quotas

### HubSpot API
- **Rate Limit**: 100 requests per 10 seconds (default)
- **Daily Limit**: Varies by plan
- **Retry Strategy**: Exponential backoff on 429 errors
- **Throttling**: 150ms delay between geocoding requests

### Mapbox API
- **Free Tier**: 100,000 requests/month
- **Geocoding**: 600 requests/minute
- **Directions**: 300 requests/minute
- **Map Loads**: Unlimited with public token

### Gemini AI API
- **Free Tier**: 60 requests/minute
- **Quota**: Check Google AI Studio dashboard
- **Model**: gemini-2.0-flash-exp (flash tier)

---

## Troubleshooting

### "API key invalid" errors
1. Check the secret name matches exactly (case-sensitive)
2. Verify token format (correct prefix)
3. Confirm scopes/permissions in provider dashboard
4. Check for trailing spaces in secret value

### Frontend can't access map
- Ensure `VITE_MAPBOX_TOKEN` is set (not just `MAPBOX_TOKEN`)
- Verify it's a PUBLIC token (pk. prefix)
- Restart workflow after adding env var

### Database connection errors
- Verify `DATABASE_URL` includes `?sslmode=require`
- Check Neon project is active
- Confirm connection string format

---

## Where Secrets Are Used

### Backend Services
- `server/sync.ts` - HubSpot sync, Mapbox geocoding
- `server/routes.ts` - All API endpoints
- `server/auth.ts` - Session encryption
- `server/ai.ts` - Gemini AI integration

### Frontend Components
- `client/src/components/map-view.tsx` - Map rendering
- `client/src/pages/plan.tsx` - Route planning
- All components use `import.meta.env.VITE_MAPBOX_TOKEN`

---

## Quick Reference: How to Get Each Token

| Token | Provider | Where to Get It |
|-------|----------|-----------------|
| `DATABASE_URL` | Neon | Replit automatically provisions |
| `HUBSPOT_API_KEY` | HubSpot | Settings → Integrations → Private Apps |
| `MAPBOX_TOKEN` | Mapbox | mapbox.com → Account → Access Tokens |
| `VITE_MAPBOX_TOKEN` | Mapbox | Same as above (use public token) |
| `GEMINI_API_KEY` | Google | aistudio.google.com → Get API Key |
| `SESSION_SECRET` | Self-generated | `openssl rand -base64 32` |

---

**Last Updated**: November 24, 2025  
**Security Note**: This file contains NO actual secrets - only documentation of what's required.
