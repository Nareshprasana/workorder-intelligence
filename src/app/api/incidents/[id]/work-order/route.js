import { PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
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

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        workOrder: true,
      },
    });

    if (!incident) {
      return Response.json({ error: "Incident not found." }, { status: 404 });
    }

    if (incident.status !== "READY") {
      return Response.json(
        { error: `Incident must be READY to create a work order. Current status: ${incident.status}` },
        { status: 400 }
      );
    }

    if (incident.workOrder) {
      return Response.json(
        { error: "Work order already exists for this incident.", workOrder: incident.workOrder },
        { status: 409 }
      );
    }

    const priority = getPriorityForSeverity(incident.severity);
    const slaHours = getSlaHoursForPriority(priority);

    const workers = await prisma.worker.findMany();

    const eligibleWorker = findEligibleWorker(workers, incident);

    const workOrderData = {
      incidentId: incident.id,
      workerId: eligibleWorker ? eligibleWorker.id : null,
      priority,
      slaHours,
      description: incident.description,
      action: incident.recommendedAction || incident.issue || "Follow SOP for inspection",
      status: eligibleWorker ? "ASSIGNED" : "PENDING",
      assignedAt: eligibleWorker ? new Date() : null,
    };

    const workOrder = await prisma.workOrder.create({
      data: workOrderData,
      include: {
        worker: true,
        incident: true,
      },
    });

    let notification = null;
    if (eligibleWorker) {
      const message = buildNotificationMessage({
        priority,
        location: incident.location,
        issue: incident.issue,
      });

      notification = await prisma.notification.create({
        data: {
          workerId: eligibleWorker.id,
          workOrderId: workOrder.id,
          title: "New Work Order Assigned",
          message,
          status: "UNREAD",
        },
      });
    }

    return Response.json(
      {
        success: true,
        workOrder,
        worker: eligibleWorker || null,
        priority,
        slaHours,
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Work order creation error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to create work order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
