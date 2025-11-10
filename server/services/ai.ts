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

    const prompt = `You are analyzing a field sales representative's visit notes for a diesel parts and service company (MSP Diesel Solutions).

Extract structured data from this sales visit transcript. The rep visited a customer and is providing insights about their business.

TRANSCRIPT:
${transcript}

INSTRUCTIONS:
- Extract all relevant information into the appropriate fields
- For fields with no information mentioned, use "Not mentioned" or "N/A"
- Be specific with machinery/engine types (e.g., "CAT C15, Cummins ISX" not just "diesel engines")
- Capture competitor names and pricing details when mentioned
- Identify clear next steps (e.g., "Send quote for injectors", "Follow up on pricing", "Schedule site visit")
- Preserve specific product model numbers (e.g., "55-75 injectors" not "injectors")

Return JSON with these exact fields:
- machineryTypes: Types of machinery customer works on (Light duty trucks / Medium duty / Heavy duty)
- engineTypes: Specific engine models in their shop
- fleetMakeup: Truck or equipment brands in their fleet
- currentSuppliers: Current parts/service vendors
- competitorData: Competitors used and what they're paying
- pricingInfo: Current pricing customer pays for products
- productModels: Specific product model numbers mentioned
- availabilityGaps: Stock/supply issues with current suppliers
- customerNeeds: What the customer needs help with
- competitivePosition: How MSP can compete or add value
- insideSalesIssues: Any issues with MSP's inside sales team
- nextSteps: Follow-up actions required
- miscNotes: Any other relevant context`;

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
            engineTypes: { type: Type.STRING },
            fleetMakeup: { type: Type.STRING },
            currentSuppliers: { type: Type.STRING },
            competitorData: { type: Type.STRING },
            pricingInfo: { type: Type.STRING },
            productModels: { type: Type.STRING },
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
