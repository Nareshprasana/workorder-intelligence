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

    const incident = await prisma.incident.findUnique({
      where: {
        id,
      },
      include: {
        asset: true,
      },
    });

    if (!incident) {
      return Response.json(
        {
          error: "Incident not found.",
        },
        { status: 404 }
      );
    }

    await prisma.incident.update({
      where: {
        id: incident.id,
      },
      data: {
        status: "ANALYZING",
      },
    });

    const analysis = await analyzeMaintenanceComplaint({
      description: incident.description,
      location: incident.location,
      assetCode: incident.asset?.assetCode ?? null,
    });

    const updatedIncident = await prisma.incident.update({
      where: {
        id: incident.id,
      },
      data: {
        category: analysis.category,
        issue: analysis.issue,
        severity: analysis.severity,
        confidence: analysis.confidence,
        recommendedAction: analysis.recommendedAction,
        aiAnalysis: JSON.stringify(analysis),

        status:
          analysis.missingInformation.length > 0
            ? "NEEDS_INFORMATION"
            : "READY",
      },
      include: {
        asset: true,
      },
    });

    return Response.json({
      success: true,
      incident: updatedIncident,
      analysis,
    });
  } catch (error) {
    console.error("Incident AI analysis error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "AI analysis failed.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}