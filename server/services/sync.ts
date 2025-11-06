import { storage } from "../storage";
import { fetchHubSpotCompanies } from "./hubspot";
import { geocodeAddress } from "./mapbox";
import { buildAddressString } from "./geo";
import type { InsertCompany } from "@shared/schema";

export async function syncCompanies(ownerId?: string): Promise<number> {
  console.log(`[Sync] Starting company sync${ownerId ? ` for owner ${ownerId}` : " (all companies)"}...`);

  try {
    const hubspotCompanies = await fetchHubSpotCompanies(ownerId);
    console.log(`[Sync] Fetched ${hubspotCompanies.length} companies from HubSpot`);

    const companiesToCache: InsertCompany[] = [];

    for (const hsCompany of hubspotCompanies) {
      const props = hsCompany.properties;

      const addressString = buildAddressString({
        street: props.address || props.address2,
        city: props.city,
        state: props.state,
        postalCode: props.zip,
        country: props.country || "US",
      });

      const existing = await storage.getCompany(hsCompany.id);
      let lat = existing?.lat || null;
      let lng = existing?.lng || null;

      if ((!lat || !lng) && addressString) {
        console.log(`[Sync] Geocoding: ${props.name} - ${addressString}`);
        const coords = await geocodeAddress(addressString);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      companiesToCache.push({
        id: hsCompany.id,
        name: props.name || "Unknown Company",
        street: props.address || props.address2 || null,
        city: props.city || null,
        state: props.state || null,
        postalCode: props.zip || null,
        country: props.country || null,
        ownerId: props.hubspot_owner_id || null,
        lat,
        lng,
      });
    }

    await storage.upsertCompanies(companiesToCache);

    console.log(`[Sync] Successfully synced ${companiesToCache.length} companies`);
    return companiesToCache.length;
  } catch (error) {
    console.error("[Sync] Error syncing companies:", error);
    throw error;
  }
}

export function startPeriodicSync(intervalMinutes: number = 15) {
  console.log(`[Sync] Starting periodic sync every ${intervalMinutes} minutes`);

  setTimeout(() => {
    syncCompanies().catch((err) =>
      console.error("[Sync] Initial sync failed:", err)
    );
  }, 30000);

  setInterval(() => {
    syncCompanies().catch((err) =>
      console.error("[Sync] Periodic sync failed:", err)
    );
  }, intervalMinutes * 60 * 1000);
}
