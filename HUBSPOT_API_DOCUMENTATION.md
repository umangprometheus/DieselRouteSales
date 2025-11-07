# HubSpot API Integration Documentation
## MSP Diesel Solutions - Route Management Application

**Document Version:** 1.0  
**Last Updated:** November 6, 2025  
**Prepared By:** Prometheus Agency

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Data Models](#data-models)
5. [Sync Logic](#sync-logic)
6. [Custom Object Implementation](#custom-object-implementation)
7. [Error Handling](#error-handling)
8. [Rate Limits & Best Practices](#rate-limits--best-practices)

---

## Overview

The Route Management Application integrates with HubSpot CRM using HubSpot's Private App API. This document outlines all API endpoints, sync logic, and data models used in the integration.

### Integration Scope

- **Companies:** Bi-directional sync of company records with geocoded addresses
- **Custom Object (Check-Ins):** Field visit records with GPS verification
- **Associations:** Link check-ins to visited companies
- **Activities:** Future enhancement for detailed visit logging

---

## Authentication

### Authentication Method
**Private App API Key** via Bearer Token

### Configuration
```
Authorization: Bearer YOUR_HUBSPOT_API_KEY
Content-Type: application/json
```

### Required API Scopes
- `crm.objects.companies.read`
- `crm.objects.companies.write`
- `crm.objects.custom.read`
- `crm.objects.custom.write`
- `crm.schemas.custom.read`
- `crm.schemas.custom.write`

### Environment Variable
```
HUBSPOT_API_KEY=pat-na2-[your-private-app-token]
```

---

## API Endpoints Reference

### 1. Companies API

#### **Fetch Companies with Pagination**
```http
GET https://api.hubapi.com/crm/v3/objects/companies
```

**Query Parameters:**
- `limit`: Number of records per page (default: 100, max: 100)
- `after`: Pagination cursor for next page
- `properties`: Comma-separated list of properties to retrieve

**Properties Retrieved:**
```
name, address, address2, city, state, zip, country, 
hubspot_owner_id, hs_lastmodifieddate
```

**Sample Request:**
```bash
curl -X GET \
  'https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=name,address,city,state,zip,hubspot_owner_id' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

**Sample Response:**
```json
{
  "results": [
    {
      "id": "209032347350",
      "properties": {
        "name": "TCB VETERAN",
        "address": "104 Saint Albans Fairway",
        "city": "Memphis",
        "state": "Tennessee",
        "zip": "38117",
        "hubspot_owner_id": "12345678"
      }
    }
  ],
  "paging": {
    "next": {
      "after": "209032347350"
    }
  }
}
```

---

### 2. Custom Object API (Check-Ins)

#### **Create Check-In Record**
```http
POST https://api.hubapi.com/crm/v3/objects/2-175854274
```

**Custom Object Type ID:** `2-175854274` (Field Visit Check-Ins)

**Request Body:**
```json
{
  "properties": {
    "check_in_name": "11/06/2025, 10:10 AM"
  }
}
```

**Sample Response:**
```json
{
  "id": "200418307822",
  "properties": {
    "check_in_name": "11/06/2025, 10:10 AM",
    "hs_createdate": "2025-11-06T16:10:17.123Z"
  },
  "createdAt": "2025-11-06T16:10:17.123Z",
  "updatedAt": "2025-11-06T16:10:17.123Z"
}
```

---

### 3. Associations API (v4)

#### **Create Check-In → Company Association**
```http
PUT https://api.hubapi.com/crm/v4/objects/2-175854274/{checkInId}/associations/0-2/{companyId}
```

**URL Parameters:**
- `{checkInId}`: The HubSpot ID of the check-in record
- `{companyId}`: The HubSpot ID of the company

**Request Body:**
```json
[
  {
    "associationCategory": "USER_DEFINED",
    "associationTypeId": 73
  }
]
```

**Important Notes:**
- Association Type ID `73` is **account-specific** (determined via API query)
- Association must be pre-configured in HubSpot UI (Settings → Objects → Check-Ins → Associations)
- Use `USER_DEFINED` category for custom object associations
- Use numeric object type IDs: `0-2` for companies, `2-175854274` for check-ins

**Query Available Association Types:**
```http
GET https://api.hubapi.com/crm/v4/associations/2-175854274/0-2/labels
```

**Sample Response:**
```json
{
  "results": [
    {
      "category": "USER_DEFINED",
      "typeId": 73,
      "label": null
    }
  ]
}
```

---

## Data Models

### Company Data Model

**Database Schema:**
```typescript
{
  id: string,              // HubSpot Company ID
  name: string,            // Company name
  street: string | null,   // Street address
  city: string | null,     // City
  state: string | null,    // State/Province
  postalCode: string | null, // ZIP/Postal code
  country: string | null,  // Country
  lat: number | null,      // Geocoded latitude
  lng: number | null,      // Geocoded longitude
  hubspotOwnerId: string | null, // Sales rep owner ID
  lastModified: Date       // Last sync timestamp
}
```

**HubSpot Properties Mapping:**
```
HubSpot Property          → Database Field
────────────────────────────────────────────
name                      → name
address                   → street
city                      → city
state                     → state
zip                       → postalCode
country                   → country
hubspot_owner_id          → hubspotOwnerId
hs_lastmodifieddate       → lastModified
```

---

### Check-In Data Model

**Database Schema:**
```typescript
{
  id: string,              // UUID
  userId: string,          // User who checked in
  companyId: string,       // Company visited
  lat: number,             // GPS latitude
  lng: number,             // GPS longitude
  timestamp: Date,         // Check-in time (CST)
  note: string | null,     // Optional visit notes
  hubspotNoteId: string | null // HubSpot check-in record ID
}
```

**HubSpot Custom Object Properties:**
```
Custom Property           → Purpose
────────────────────────────────────────────
check_in_name             → Formatted timestamp (MM/DD/YYYY, HH:MM AM/PM CST)
```

**Future Enhancements (Voice-to-Text Data):**
```
machinery_types           → Types of machinery serviced
engine_types              → Specific engine models
fleet_makeup              → Truck/equipment brands
current_suppliers         → Current parts vendors
competitor_data           → Competitive intelligence
pricing_information       → Market pricing data
product_models            → Specific product model numbers
availability_gaps         → Stock/supply issues
customer_needs            → Customer requirements
competitive_position      → MSP's value proposition
inside_sales_issues       → Internal team feedback
next_steps                → Follow-up actions required
miscellaneous_notes       → Additional context
```

---

## Sync Logic

### Company Sync Process

**Trigger:** Manual sync button or scheduled (every 15 minutes)

**Flow:**
```
1. Fetch all companies from HubSpot (paginated, 100 per page)
   ↓
2. For each company:
   a. Extract address components
   b. Geocode address using Mapbox API (if not already geocoded)
   c. Rate limit: 150ms delay between geocoding requests
   ↓
3. Upsert to local database:
   - If company exists: Update properties
   - If new: Insert new record
   ↓
4. Preserve existing lat/lng coordinates (avoid re-geocoding)
   ↓
5. Log sync results (success/error counts)
```

**Geocoding Logic:**
```javascript
// Only geocode if coordinates don't exist
if (!existingCompany.lat || !existingCompany.lng) {
  const address = `${street}, ${city}, ${state} ${postalCode}`;
  const coords = await geocodeAddress(address);
  company.lat = coords.lat;
  company.lng = coords.lng;
}
```

**Error Handling:**
- Failed geocoding: Skip coordinates, save company anyway
- Invalid addresses: Log warning, continue sync
- API rate limits: Exponential backoff, retry after delay

---

### Check-In Creation Flow

**Trigger:** User checks in at a company location (within 800 feet)

**Flow:**
```
1. User initiates check-in from mobile app
   ↓
2. Verify GPS proximity (800-foot radius)
   ↓
3. Create local database record
   ↓
4. Create HubSpot Custom Object record (async)
   - Format timestamp in CST timezone
   - Set check_in_name property
   ↓
5. Create association to company (if not demo company)
   - Use association type ID 73
   - Use USER_DEFINED category
   ↓
6. Update local record with HubSpot ID
   ↓
7. Mark route stop as completed (if part of active route)
```

**Demo Company Handling:**
- Companies with ID starting with `demo-` are local test data
- Skip HubSpot association creation for demo companies
- Log skip action for debugging

**Timezone Handling:**
```javascript
// Format timestamp in Central Time (CST/CDT)
const recordName = checkInDate.toLocaleString('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'America/Chicago'  // CST timezone
});
// Result: "11/06/2025, 10:10 AM"
```

---

## Custom Object Implementation

### Setup Requirements

#### 1. Create Custom Object in HubSpot
- Navigate to: **Settings → Data Management → Objects → Create custom object**
- Object Name: **Field Visit Check-Ins**
- Object ID: `2-175854274`

#### 2. Define Custom Properties
**Required Property:**
- `check_in_name` (Single-line text) - Stores formatted timestamp

**Future Properties (for AI-parsed data):**
- `machinery_types` (Dropdown/Multi-select)
- `engine_types` (Multi-line text)
- `fleet_makeup` (Multi-line text)
- `current_suppliers` (Multi-line text)
- `competitor_data` (Multi-line text)
- `pricing_information` (Multi-line text)
- `product_models` (Multi-line text)
- `availability_gaps` (Multi-line text)
- `customer_needs` (Multi-line text)
- `competitive_position` (Multi-line text)
- `inside_sales_issues` (Multi-line text)
- `next_steps` (Dropdown)
- `miscellaneous_notes` (Multi-line text)

#### 3. Configure Association
- Navigate to: **Settings → Data Management → Objects → Check-Ins → Associations**
- Click: **Set up association**
- Select: **Companies**
- Association Type: Unlabeled (default)
- Result: Creates association type ID (e.g., 73)

---

## Error Handling

### Company Sync Errors

| Error Type | Handling Strategy |
|------------|------------------|
| Invalid API key | Throw error, halt sync |
| Rate limit exceeded | Exponential backoff, retry |
| Geocoding failure | Log warning, save without coordinates |
| Invalid address | Skip geocoding, save company data |
| Network timeout | Retry up to 3 times |

### Check-In Creation Errors

| Error Type | Handling Strategy |
|------------|------------------|
| Custom object creation fails | Log error, notify user |
| Association creation fails | Log error, check-in still created |
| Demo company association | Skip silently (expected behavior) |
| Invalid company ID | Return 404, prevent check-in |
| GPS verification failure | Prevent check-in, require proximity |

### Logging Examples

**Success:**
```
✅ Created check-in record 200418307822: "11/06/2025, 10:10 AM"
✅ Associated check-in 200418307822 with company 209032347350
✅ Created HubSpot field visit 200418307822 for check-in 318f8347-956c-43d7-a0f3-b9addc849d89
```

**Skipped Demo:**
```
⏭️  Skipped association for demo company demo-9
```

**Error:**
```
❌ Failed to create check-in → company association: Request failed with status code 400
   Association error: {
     "status": "error",
     "message": "One or more associations are invalid"
   }
```

---

## Rate Limits & Best Practices

### HubSpot API Rate Limits

**Standard Limits:**
- 100 requests per 10 seconds
- 100 companies per request (pagination)

**Our Implementation:**
- Batch company fetches at 100 per page
- 150ms delay between Mapbox geocoding requests
- Async check-in creation (non-blocking)

### Best Practices

1. **Pagination**
   - Always use pagination for large datasets
   - Respect `paging.next.after` cursors

2. **Error Recovery**
   - Log all API errors with correlation IDs
   - Implement retry logic with exponential backoff
   - Preserve partial sync progress

3. **Data Integrity**
   - Validate data before sending to HubSpot
   - Use upsert patterns (create or update)
   - Maintain local cache for offline capability

4. **Performance**
   - Cache frequently accessed data locally
   - Use bulk operations when available
   - Minimize unnecessary API calls

5. **Monitoring**
   - Track sync success/failure rates
   - Monitor API response times
   - Alert on repeated failures

---

## API Endpoint Summary Table

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/crm/v3/objects/companies` | GET | Fetch companies | 100/10s |
| `/crm/v3/objects/2-175854274` | POST | Create check-in | 100/10s |
| `/crm/v4/objects/2-175854274/{id}/associations/0-2/{companyId}` | PUT | Associate check-in to company | 100/10s |
| `/crm/v4/associations/2-175854274/0-2/labels` | GET | Query association types | 100/10s |

---

## Support & Troubleshooting

### Common Issues

**Issue:** Association creation fails with "COMPANY=[checkInId] is not valid"  
**Solution:** Verify object type IDs are correct (0-2 for companies, 2-175854274 for check-ins)

**Issue:** Timestamp shows wrong timezone in HubSpot  
**Solution:** Ensure `timeZone: 'America/Chicago'` is set in timestamp formatting

**Issue:** Demo companies cause association errors  
**Solution:** Skip demo companies (ID starts with "demo-") in association logic

**Issue:** Geocoding fails for international addresses  
**Solution:** Mapbox API handles international addresses; verify address format

### Debug Endpoint

The application includes a debug endpoint to query association types:

```http
GET /api/debug/association-types
```

This endpoint queries HubSpot's API to retrieve available association type IDs between check-ins and companies, useful for troubleshooting association issues.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 6, 2025 | Initial documentation |

---

## Contact Information

**Technical Support:**  
Prometheus Agency Development Team

**HubSpot Account:**  
MSP Diesel Solutions  
Portal ID: 242535417

---

*This document is proprietary and confidential. Distribution limited to MSP Diesel Solutions and Prometheus Agency personnel.*
