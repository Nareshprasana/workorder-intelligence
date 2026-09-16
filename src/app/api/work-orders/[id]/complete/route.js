import { PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { worker: true, incident: true },
    });

    if (!workOrder) {
      return Response.json({ error: "Work order not found." }, { status: 404 });
    }

    if (!["ASSIGNED", "IN_PROGRESS"].includes(workOrder.status)) {
      return Response.json(
        { error: `Work order cannot be completed from status ${workOrder.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: { worker: true, incident: true },
    });

    if (workOrder.workerId) {
      await prisma.worker.update({
        where: { id: workOrder.workerId },
        data: { status: "AVAILABLE" },
      });
    }

    await prisma.incident.update({
      where: { id: workOrder.incidentId },
      data: { status: "COMPLETED" },
    });

    return Response.json({ success: true, workOrder: updated });
  } catch (error) {
    console.error("Complete work order error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to complete work order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
