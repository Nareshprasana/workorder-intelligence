import { PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { analyzeMaintenanceComplaint } from "../../../../../lib/ai";
import {
  getPriorityForSeverity,
  getSlaHoursForPriority,
  findEligibleWorker,
  buildNotificationMessage,
} from "../../../../../lib/work-order-rules";

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
      include: { asset: true, workOrder: true },
    });

    if (!incident) {
      return Response.json({ error: "Incident not found." }, { status: 404 });
    }

    if (incident.status === "ANALYZING" && !isRetry) {
      return Response.json({ success: true, status: "ANALYZING", incident, message: "Analysis already in progress." });
    }

    if ((incident.status === "READY" || incident.status === "NEEDS_INFORMATION") && !isRetry) {
      return Response.json({ success: true, status: incident.status, incident, message: "Analysis already completed." });
    }

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
      const current = await prisma.incident.findUnique({ where: { id: incident.id }, include: { asset: true, resident: true, workOrder: true } });
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
      include: { asset: true, resident: true, client: true, property: true, workOrder: true },
    });

    // Auto-create Work Request when READY (simple product workflow)
    let workOrder = null;
    let notification = null;
    if (updatedIncident.status === "READY" && !updatedIncident.workOrder) {
      const priority = getPriorityForSeverity(updatedIncident.severity);
      const slaHours = getSlaHoursForPriority(priority);
      const workers = await prisma.worker.findMany();
      // Use incident for eligibility (category + location)
      const eligibleWorker = findEligibleWorker(workers, updatedIncident);
      workOrder = await prisma.workOrder.create({
        data: {
          incidentId: updatedIncident.id,
          workerId: eligibleWorker ? eligibleWorker.id : null,
          priority,
          slaHours,
          description: updatedIncident.description,
          action: updatedIncident.recommendedAction || updatedIncident.issue || "Follow SOP for inspection",
          status: eligibleWorker ? "ASSIGNED" : "PENDING",
          assignedAt: eligibleWorker ? new Date() : null,
        },
        include: { worker: true, incident: true },
      });
      if (eligibleWorker) {
        const message = buildNotificationMessage({
          priority,
          location: updatedIncident.location,
          issue: updatedIncident.issue,
        });
        notification = await prisma.notification.create({
          data: {
            workerId: eligibleWorker.id,
            workOrderId: workOrder.id,
            title: "New Work Request",
            message,
            status: "UNREAD",
          },
        });
      }
    }

    return Response.json({
      success: true,
      incident: updatedIncident,
      analysis,
      status: updatedIncident.status,
      workOrder,
      notification,
    });
  } catch (error) {
    console.error("Incident AI analysis error:", error);
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
