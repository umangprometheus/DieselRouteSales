import { Client } from '@hubspot/api-client';

function getHubSpotClient() {
  const apiKey = process.env.HUBSPOT_API_KEY;

  if (!apiKey) {
    throw new Error('HUBSPOT_API_KEY environment variable not set. Please add your Private App API key to Replit Secrets.');
  }

  return new Client({ accessToken: apiKey });
}

export async function fetchHubSpotCompanies(ownerId?: string) {
  const client = getHubSpotClient();

  const properties = [
    "name",
    "address",
    "address2",
    "city",
    "state",
    "zip",
    "country",
    "hubspot_owner_id",
    "hs_lastmodifieddate",
  ];

  const limit = 100;
  let after: string | undefined = undefined;
  const allCompanies: any[] = [];

  try {
    do {
      const response = await client.crm.companies.basicApi.getPage(
        limit,
        after,
        properties
      );

      const companies = response.results;
      allCompanies.push(...companies);
      after = response.paging?.next?.after;
    } while (after);

    if (ownerId) {
      return allCompanies.filter(
        (c) => c.properties.hubspot_owner_id === ownerId
      );
    }

    return allCompanies;
  } catch (error) {
    console.error("Error fetching HubSpot companies:", error);
    throw error;
  }
}

export async function createFieldVisitCheckIn(
  companyId: string,
  companyName: string,
  userId: string,
  username: string,
  lat: number,
  lng: number,
  note: string | null,
  timestamp: string
) {
  const client = getHubSpotClient();

  // Use custom object type ID from HubSpot (2-175854274)
  const customObjectTypeId = "2-175854274";

  try {
    // Create check-in record with just the timestamp as the name
    const checkInDate = new Date(timestamp);
    const recordName = checkInDate.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const customObjectResponse = await client.crm.objects.basicApi.create(customObjectTypeId, {
      properties: {
        check_in_name: recordName, // Use timestamp as record name
      },
    });

    console.log(`✅ Created check-in record ${customObjectResponse.id}: "${recordName}"`);

    // Associate the check-in with the company using v4 API
    // Use numeric object type IDs: 0-2 for companies
    try {
      const axios = (await import('axios')).default;
      const apiKey = process.env.HUBSPOT_API_KEY;
      
      // CRITICAL: Use 0-2 (not "company") for the company object type
      const url = `https://api.hubapi.com/crm/v4/objects/${customObjectTypeId}/${customObjectResponse.id}/associations/0-2/${companyId}`;
      
      await axios.put(
        url,
        [
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 280  // Standard unlabeled company association
          }
        ],
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log(`✅ Associated check-in ${customObjectResponse.id} with company ${companyId} (type: 280)`);
    } catch (assocError: any) {
      console.error("❌ Failed to create check-in → company association:", assocError?.message || assocError);
      if (assocError?.response?.data) {
        console.error("   Association error:", JSON.stringify(assocError.response.data, null, 2));
      }
    }

    return customObjectResponse.id;
  } catch (error: any) {
    console.error("Error creating check-in record:", error);

    if (error?.body?.category === "OBJECT_NOT_FOUND" || error?.statusCode === 404) {
      console.log("Custom check-in object not found, falling back to Note creation");
      return await createHubSpotNote(companyId, companyName, username, lat, lng, note, timestamp);
    }

    throw error;
  }
}

async function createHubSpotNote(
  companyId: string,
  companyName: string,
  username: string,
  lat: number,
  lng: number,
  note: string | null,
  timestamp: string
) {
  const client = getHubSpotClient();

  const noteBody = `
**Field Check-In**

- **Company:** ${companyName}
- **Time:** ${new Date(timestamp).toLocaleString()}
- **GPS:** ${lat.toFixed(6)}, ${lng.toFixed(6)}
- **Rep:** ${username}
- **Notes:** ${note || "—"}
  `.trim();

  try {
    const noteResponse = await client.crm.objects.notes.basicApi.create({
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: new Date(timestamp).getTime().toString(),
      },
      associations: [
        {
          to: { id: companyId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED" as any,
              associationTypeId: 190,
            },
          ],
        },
      ],
    });

    return noteResponse.id;
  } catch (error) {
    console.error("Error creating HubSpot note:", error);
    throw error;
  }
}

export async function fetchHubSpotOwners() {
  const client = getHubSpotClient();

  try {
    const response = await client.crm.owners.ownersApi.getPage();
    return response.results.map((owner: any) => ({
      id: owner.id,
      email: owner.email,
      firstName: owner.firstName,
      lastName: owner.lastName,
    }));
  } catch (error) {
    console.error("Error fetching HubSpot owners:", error);
    throw error;
  }
}
