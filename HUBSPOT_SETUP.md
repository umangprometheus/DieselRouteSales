# HubSpot Custom Object Setup Guide

This guide explains how to configure the HubSpot custom object properties to receive structured visit data from field check-ins.

## Overview

The MSP Diesel Route App creates check-in records in HubSpot's "Field Visit Check-Ins" custom object (ID: `2-175854274`). The application automatically falls back to creating simple Notes if the custom properties haven't been configured yet.

## Current Status

**Graceful Degradation**: The application is designed to work WITHOUT these properties configured. If properties are missing, check-ins are saved to:
1. ✅ Local PostgreSQL database (all structured data preserved)
2. ✅ HubSpot as simplified Notes (basic visit info only)
3. ❌ HubSpot Custom Object with full structured data (requires configuration below)

## Required Custom Object Properties

Navigate to **Settings → Objects → Field Visit Check-Ins → Properties** in your HubSpot portal and create the following custom properties:

| Property Name | Internal Name | Field Type | Description |
|--------------|---------------|------------|-------------|
| Machinery Types | `machinery_types` | Dropdown | Light/Medium/Heavy duty trucks |
| Engine Types | `engine_types` | Multi-line text | Specific engine models in shop |
| Fleet Makeup | `fleet_makeup` | Multi-line text | Truck/equipment brands in fleet |
| Current Suppliers | `current_suppliers` | Multi-line text | Current vendors providing parts |
| Competitor Data | `competitor_data` | Multi-line text | Competitors and their pricing |
| Pricing Info | `pricing_info` | Multi-line text | Current pricing from suppliers |
| Product Models | `product_models` | Multi-line text | Specific part numbers (not generic names) |
| Availability Gaps | `availability_gaps` | Multi-line text | Stock-out/delay issues from suppliers |
| Customer Needs | `customer_needs` | Multi-line text | What customer does and needs |
| Competitive Position | `competitive_position` | Multi-line text | Where MSP can compete/add value |
| Inside Sales Issues | `inside_sales_issues` | Multi-line text | MSP internal team issues |
| Next Steps | `next_steps` | Multi-line text | Follow-up actions required |
| Miscellaneous Notes | `misc_notes` | Multi-line text | Additional context |
| Voice Transcript | `voice_transcript` | Multi-line text | Raw transcript from voice recording |
| Visit Duration (Minutes) | `visit_duration_min` | Number | Time spent at customer location |

### Machinery Types Dropdown Options

If using a dropdown for `machinery_types`, configure these options:
- Light duty trucks
- Medium duty trucks
- Heavy duty trucks
- Light & Medium duty
- Medium & Heavy duty
- All duty types

## Verification

After creating the properties, the next check-in will automatically sync full structured data to HubSpot. Server logs will show:

```
✅ Created check-in record [ID]: "[timestamp]"
✅ Associated check-in [ID] with company [company_id]
```

If properties are still missing, you'll see:
```
⚠️  HubSpot properties not configured yet. Create properties in HubSpot portal:
   Settings → Objects → Field Visit Check-Ins → Properties
   Falling back to simplified Note creation
```

## HubSpot Tasks from Next Steps

Once properties are configured, a future enhancement (Task 14) will automatically create HubSpot tasks from the `next_steps` field content.

## Technical Details

- **Custom Object Type ID**: `2-175854274`
- **Association Type ID**: `73` (to Companies)
- **Association Category**: `USER_DEFINED`
- **Company Object Type ID**: `0-2`
- **API Version**: CRM API v4 for associations
- **Timezone**: America/Chicago (CST) for all timestamps

## Error Handling

The application gracefully handles:
1. **PROPERTY_DOESNT_EXIST**: Falls back to Note creation
2. **VALIDATION_ERROR**: Falls back to Note creation
3. **OBJECT_NOT_FOUND**: Falls back to Note creation
4. **Demo companies** (ID starting with "demo-"): Skips HubSpot sync entirely

All check-ins are ALWAYS saved to the local database regardless of HubSpot status.
