import { GoogleGenAI } from "@google/genai";
import { maintenanceAnalysisSchema } from "./ai-schema";

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function analyzeMaintenanceComplaint({
  description,
  location,
}) {
  const prompt = `
You are a maintenance operations AI.

Analyze the following maintenance complaint.

Complaint:
${description}

Reported location:
${location || "Not provided"}

Extract the maintenance information accurately.

Rules:

1. Do not invent a location.
2. If important information is missing, put it in missingInformation.
3. confidence must represent how confident you are in the extracted information.
4. CRITICAL should only be used for immediate safety risks.
5. If there is a possible electrical safety hazard, treat it seriously.
6. recommendedAction should be a concise maintenance recommendation.
7. Return only information supported by the complaint.
`;

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            enum: [
              "HVAC",
              "ELECTRICAL",
              "PLUMBING",
              "LIFT",
              "GENERAL",
            ],
          },
          issue: {
            type: "STRING",
          },
          location: {
            type: "STRING",
            nullable: true,
          },
          severity: {
            type: "STRING",
            enum: [
              "LOW",
              "MEDIUM",
              "HIGH",
              "CRITICAL",
            ],
          },
          confidence: {
            type: "NUMBER",
          },
          missingInformation: {
            type: "ARRAY",
            items: {
              type: "STRING",
            },
          },
          recommendedAction: {
            type: "STRING",
            nullable: true,
          },
        },
        required: [
          "category",
          "issue",
          "location",
          "severity",
          "confidence",
          "missingInformation",
          "recommendedAction",
        ],
      },
    },
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsed = JSON.parse(rawText);

  return maintenanceAnalysisSchema.parse(parsed);
}