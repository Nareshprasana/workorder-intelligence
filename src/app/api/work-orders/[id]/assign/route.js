import { PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  isWorkerEligibleForCategory,
  buildNotificationMessage,
} from "../../../../../lib/work-order-rules";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const workerId = body.workerId ? String(body.workerId).trim() : null;

    if (!workerId) {
      return Response.json({ error: "workerId is required." }, { status: 400 });
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { incident: true, worker: true },
    });

    if (!workOrder) {
      return Response.json({ error: "Work order not found." }, { status: 404 });
    }

    if (workOrder.status !== "PENDING" || workOrder.workerId) {
      return Response.json({ error: `Work order cannot be assigned from status ${workOrder.status}` }, { status: 400 });
    }

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) {
      return Response.json({ error: "Worker not found." }, { status: 404 });
    }

    if (worker.status !== "AVAILABLE") {
      return Response.json({ error: "Worker is not available." }, { status: 400 });
    }

    if (!isWorkerEligibleForCategory(worker, workOrder.incident?.category)) {
      return Response.json({ error: `Worker does not have required skill for ${workOrder.incident?.category}` }, { status: 400 });
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        workerId: worker.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: { worker: true, incident: true },
    });

    const message = buildNotificationMessage({
      priority: workOrder.priority,
      location: workOrder.incident?.location,
      issue: workOrder.incident?.issue,
    });

    const notification = await prisma.notification.create({
      data: {
        workerId: worker.id,
        workOrderId: workOrder.id,
        title: "New Work Order Assigned",
        message,
        status: "UNREAD",
      },
    });

    return Response.json({ success: true, workOrder: updated, notification });
  } catch (error) {
    console.error("Assign work order error:", error);
    return Response.json({ success: false, error: error.message || "Failed to assign work order" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { incident: { select: { id: true, category: true, location: true } }, worker: true },
    });
    if (!workOrder) return Response.json({ error: "Work order not found." }, { status: 404 });
    if (workOrder.status !== "PENDING") return Response.json({ success: true, eligibleWorkers: [] });

    const workers = await prisma.worker.findMany({ where: { status: "AVAILABLE" } });
    const eligible = workers.filter((w) => isWorkerEligibleForCategory(w, workOrder.incident?.category));
    const location = (workOrder.incident?.location || "").toLowerCase();
    eligible.sort((a, b) => {
      const aMatch = location.includes(a.location.toLowerCase()) ? 0 : 1;
      const bMatch = location.includes(b.location.toLowerCase()) ? 0 : 1;
      return aMatch - bMatch;
    });
    return Response.json({ success: true, eligibleWorkers: eligible.map((w) => ({ id: w.id, name: w.name, skills: w.skills, location: w.location, status: w.status })) });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
