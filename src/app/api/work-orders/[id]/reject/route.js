import { PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
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

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { incident: true, worker: true },
    });

    if (!workOrder) {
      return Response.json({ error: "Work order not found." }, { status: 404 });
    }

    if (!workOrder.workerId) {
      return Response.json({ error: "Work order is not assigned." }, { status: 400 });
    }

    if (!["ASSIGNED", "PENDING"].includes(workOrder.status)) {
      return Response.json(
        { error: `Cannot reject work order in status ${workOrder.status}` },
        { status: 400 }
      );
    }

    const rejectingWorkerId = workOrder.workerId;

    // Fetch all workers to find next eligible excluding rejecting worker
    const workers = await prisma.worker.findMany();
    const incident = workOrder.incident;

    const nextWorker = findEligibleWorker(workers, incident, rejectingWorkerId);

    let updated;
    let notification = null;

    if (nextWorker) {
      updated = await prisma.workOrder.update({
        where: { id },
        data: {
          workerId: nextWorker.id,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
        include: { worker: true, incident: true },
      });

      const message = buildNotificationMessage({
        priority: workOrder.priority,
        location: incident.location,
        issue: incident.issue,
        recommendedAction: workOrder.action,
      });

      notification = await prisma.notification.create({
        data: {
          workerId: nextWorker.id,
          workOrderId: workOrder.id,
          title: "New Maintenance Work Order",
          message: `Reassigned: ${message}`,
          status: "UNREAD",
        },
      });

      // Optionally set rejecting worker back to AVAILABLE if they were BUSY
      // Keep as is unless they were marked BUSY earlier; for simplicity ensure AVAILABLE
      await prisma.worker.update({
        where: { id: rejectingWorkerId },
        data: { status: "AVAILABLE" },
      });
    } else {
      updated = await prisma.workOrder.update({
        where: { id },
        data: {
          workerId: null,
          status: "PENDING",
          assignedAt: null,
        },
        include: { worker: true, incident: true },
      });

      await prisma.worker.update({
        where: { id: rejectingWorkerId },
        data: { status: "AVAILABLE" },
      });
    }

    return Response.json({
      success: true,
      workOrder: updated,
      reassignedTo: nextWorker || null,
      notification,
    });
  } catch (error) {
    console.error("Reject work order error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to reject work order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
