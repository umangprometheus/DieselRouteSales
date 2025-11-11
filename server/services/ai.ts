/**
 * AI Service - Voice transcription and structured data extraction using Gemini
 * Uses Replit AI Integrations (no API key needed, billed to credits)
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { StructuredVisitData } from "@shared/schema";

// Initialize Gemini client using Replit AI Integrations
// This uses Replit's AI Integrations service, which provides Gemini-compatible API access without requiring your own Gemini API key.
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "",
  },
});

/**
 * Transcribe audio to text using Gemini's audio processing capabilities
 * @param audioBuffer - Base64-encoded audio data
 * @param mimeType - Audio MIME type (e.g., 'audio/webm', 'audio/mp4', 'audio/wav')
 * @returns Transcribed text
 */
export async function transcribeAudio(
  audioBuffer: string,
  mimeType: string
): Promise<string> {
  try {
    console.log(`🎤 Transcribing audio (${mimeType})...`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { 
              text: "Transcribe this audio recording. Provide only the transcript text with proper punctuation and capitalization." 
            },
            {
              inlineData: {
                mimeType,
                data: audioBuffer,
              },
            },
          ],
        },
      ],
    });

    const transcript = response.text || "";
    console.log(`✅ Transcription complete (${transcript.length} characters)`);
    return transcript;
  } catch (error) {
    console.error("❌ Transcription failed:", error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse unstructured transcript into structured visit data using Gemini
 * Uses JSON schema to ensure consistent, structured output
 * @param transcript - Raw transcript text from voice recording
 * @returns Structured visit data with all required fields
 */
export async function parseVisitData(
  transcript: string
): Promise<StructuredVisitData> {
  try {
    console.log(`🔍 Parsing visit data from transcript (${transcript.length} characters)...`);

    // Check if transcript is too short or contains only noise/meaningless content
    const cleanedTranscript = transcript.trim().toLowerCase();
    const isNoise = cleanedTranscript.length < 20 || 
                   cleanedTranscript.match(/^\[.*\]$/) || // Just bracketed sounds like [Bell sound]
                   cleanedTranscript.match(/^(oh|um|uh|ah|hmm|okay|alright|yeah|yes|no|test|testing|hello|hi)+\.?$/);
    
    if (isNoise) {
      console.log(`✅ Transcript too short or contains only noise - returning empty form`);
      // Return completely empty data for manual entry
      return {
        machineryTypes: "",
        engineTypes: [],
        fleetMakeup: [],
        currentSuppliers: [],
        competitorData: [],
        pricingInfo: "",
        productModels: [],
        availabilityGaps: "",
        customerNeeds: "",
        competitivePosition: "",
        insideSalesIssues: "",
        nextSteps: "",
        miscNotes: ""
      };
    }

    const prompt = `You are analyzing a field sales representative's visit notes for a diesel parts and service company (MSP Diesel Solutions).

Extract structured data from this sales visit transcript. The rep visited a customer and is providing insights about their business.

TRANSCRIPT:
${transcript}

FIELD CONTEXT AND OPTIONS:
Below are the predefined options for each field. When possible, match the transcript content to these options. If something doesn't match exactly but is similar, use the closest match. For items not in the list, note them separately.

MACHINERY TYPES (single selection):
- Light duty trucks
- Medium duty trucks
- Heavy duty trucks
- Light & Medium duty
- Medium & Heavy duty
- All duty types

ENGINE TYPES (multiple selections possible):
Common options: CAT C15, CAT C13, CAT 3406, Cummins ISX, Cummins X15, Cummins N14, Detroit Series 60, Detroit DD15, Detroit DD13, PACCAR MX-13, Volvo D13, Mack MP8, International MaxxForce
Return as array of strings. If other engines mentioned, include them.

FLEET MAKEUP (multiple selections possible):
Common brands: Freightliner, Peterbilt, Kenworth, Volvo, Mack, International, Ford, Chevrolet, RAM, GMC, Isuzu, Hino
Return as array of strings. If other brands mentioned, include them.

CURRENT SUPPLIERS (multiple selections possible):
Known suppliers: NAPA, FleetPride, OEM Dealer, O'Reilly, AutoZone, Advance Auto Parts, TruckPro, Rush Truck Centers, Penske, Ryder, Love's, TA/Petro
Return as array of strings. If other suppliers mentioned, include them.

COMPETITORS (multiple selections possible):
Known competitors: Bosch, Denso, Delphi, Stanadyne, Diesel X, Industrial Injection, S&S Diesel, Dynomite Diesel, DIPACO, Pure Power, Alliant Power
Return as array of strings. If other competitors mentioned, include them with any pricing info.

PRODUCT MODELS (multiple selections possible):
Common products: 55-75 Injectors, Remanufactured Injectors, New Injectors, High Pressure Pumps, Lift Pumps, Remanufactured Turbos, New Turbos, DPF Filters, EGR Valves, NOx Sensors, Pressure Sensors, Complete Overhaul Kits
Return as array of strings. If other products mentioned, include them.

INSTRUCTIONS:
- Extract all relevant information into the appropriate fields
- For multi-select fields (marked above), return as arrays of strings
- For fields with no information mentioned, use empty array [] for multi-select or "Not mentioned" for text fields
- Be specific and preserve exact model numbers when mentioned
- Identify clear next steps (e.g., "Send quote for injectors", "Follow up on pricing")
- If something doesn't exactly match predefined options but is similar, use the closest match

Return JSON with these exact fields:
- machineryTypes: (string) Types of machinery customer works on
- engineTypes: (array of strings) Specific engine models in their shop
- fleetMakeup: (array of strings) Truck or equipment brands in their fleet  
- currentSuppliers: (array of strings) Current parts/service vendors
- competitorData: (array of strings) Competitors used and pricing if mentioned
- pricingInfo: (string) Current pricing customer pays for products
- productModels: (array of strings) Specific product models mentioned
- availabilityGaps: (string) Stock/supply issues with current suppliers
- customerNeeds: (string) What the customer needs help with
- competitivePosition: (string) How MSP can compete or add value
- insideSalesIssues: (string) Any issues with MSP's inside sales team
- nextSteps: (string) Follow-up actions required
- miscNotes: (string) Any other relevant context`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            machineryTypes: { type: Type.STRING },
            engineTypes: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            fleetMakeup: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            currentSuppliers: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            competitorData: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            pricingInfo: { type: Type.STRING },
            productModels: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            availabilityGaps: { type: Type.STRING },
            customerNeeds: { type: Type.STRING },
            competitivePosition: { type: Type.STRING },
            insideSalesIssues: { type: Type.STRING },
            nextSteps: { type: Type.STRING },
            miscNotes: { type: Type.STRING },
          },
          required: [
            "machineryTypes",
            "engineTypes",
            "fleetMakeup",
            "currentSuppliers",
            "competitorData",
            "pricingInfo",
            "productModels",
            "availabilityGaps",
            "customerNeeds",
            "competitivePosition",
            "insideSalesIssues",
            "nextSteps",
            "miscNotes",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}") as StructuredVisitData;
    console.log(`✅ Visit data parsed successfully`);
    return parsedData;
  } catch (error) {
    console.error("❌ Parsing failed:", error);
    throw new Error(`Failed to parse visit data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Combined transcribe and parse operation
 * @param audioBuffer - Base64-encoded audio data
 * @param mimeType - Audio MIME type
 * @returns Transcript and parsed structured data
 */
export async function transcribeAndParse(
  audioBuffer: string,
  mimeType: string
): Promise<{ transcript: string; parsedData: StructuredVisitData }> {
  const transcript = await transcribeAudio(audioBuffer, mimeType);
  const parsedData = await parseVisitData(transcript);
  return { transcript, parsedData };
}
