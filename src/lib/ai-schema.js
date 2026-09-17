import { z } from "zod";

export const maintenanceAnalysisSchema = z.object({
  category: z.enum([
    "HVAC",
    "ELECTRICAL",
    "PLUMBING",
    "LIFT",
    "GENERAL",
  ]),

  issue: z.string(),

  location: z.string().nullable(),

  severity: z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ]),

  confidence: z.number().min(0).max(1),

  missingInformation: z.array(z.string()),

  recommendedAction: z.string().nullable(),
});