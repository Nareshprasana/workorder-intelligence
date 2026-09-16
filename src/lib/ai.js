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
  assetCode,
}) {
  const prompt = `
You are a maintenance operations AI.

Analyze the following maintenance complaint.

Complaint:
${description}

Reported location:
${location || "Not provided"}

Reported asset code:
${assetCode || "Not provided"}

Extract the maintenance information accurately.

Rules:

1. Do not invent an asset code.
2. Do not invent a location.
3. If important information is missing, put it in missingInformation.
4. confidence must represent how confident you are in the extracted information.
5. CRITICAL should only be used for immediate safety risks.
6. If there is a possible electrical safety hazard, treat it seriously.
7. recommendedAction should be a concise maintenance recommendation.
8. Return only information supported by the complaint.
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
          assetCode: {
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
          "assetCode",
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