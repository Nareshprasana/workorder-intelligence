import { PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { analyzeMaintenanceComplaint } from "../../../../../lib/ai";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const isRetry = body.retry === true;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!incident) {
      return Response.json({ error: "Incident not found." }, { status: 404 });
    }

    // Duplicate protection: if already ANALYZING and not a retry, return current
    if (incident.status === "ANALYZING" && !isRetry) {
      return Response.json({ success: true, status: "ANALYZING", incident, message: "Analysis already in progress." });
    }

    // If already READY or NEEDS_INFORMATION and not a retry, do not re-run
    if ((incident.status === "READY" || incident.status === "NEEDS_INFORMATION") && !isRetry) {
      return Response.json({ success: true, status: incident.status, incident, message: "Analysis already completed." });
    }

    // For NEW or retry, set ANALYZING before calling Gemini
    // Also for ANALYZING+retry, ensure status is ANALYZING
    await prisma.incident.update({
      where: { id: incident.id },
      data: { status: "ANALYZING" },
    });

    let analysis;
    try {
      analysis = await analyzeMaintenanceComplaint({
        description: incident.description,
        location: incident.location,
        assetCode: incident.asset?.assetCode ?? null,
      });
    } catch (aiError) {
      console.error("Gemini analysis failed for incident", incident.id, aiError?.message);
      // Keep incident as ANALYZING, do not delete, return safe error
      const current = await prisma.incident.findUnique({ where: { id: incident.id }, include: { asset: true, client: true, property: true } });
      return Response.json(
        {
          success: false,
          error: "AI analysis temporarily unavailable",
          status: "ANALYZING",
          incident: current,
        },
        { status: 503 }
      );
    }

    const updatedIncident = await prisma.incident.update({
      where: { id: incident.id },
      data: {
        category: analysis.category,
        issue: analysis.issue,
        severity: analysis.severity,
        confidence: analysis.confidence,
        recommendedAction: analysis.recommendedAction,
        aiAnalysis: JSON.stringify(analysis),
        status: analysis.missingInformation.length > 0 ? "NEEDS_INFORMATION" : "READY",
      },
      include: { asset: true, client: true, property: true },
    });

    return Response.json({
      success: true,
      incident: updatedIncident,
      analysis,
      status: updatedIncident.status,
    });
  } catch (error) {
    console.error("Incident AI analysis error:", error);
    // Avoid exposing internal details; if incident still exists, keep it
    return Response.json(
      {
        success: false,
        error: "AI analysis temporarily unavailable",
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
