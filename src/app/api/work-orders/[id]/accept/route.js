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

    if (!workOrder.workerId) {
      return Response.json({ error: "Work order is not assigned to a worker." }, { status: 400 });
    }

    if (workOrder.status !== "ASSIGNED") {
      return Response.json(
        { error: `Work order cannot be accepted from status ${workOrder.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      include: { worker: true, incident: true },
    });

    // Mark worker as BUSY
    if (workOrder.workerId) {
      await prisma.worker.update({
        where: { id: workOrder.workerId },
        data: { status: "BUSY" },
      });
    }

    return Response.json({ success: true, workOrder: updated });
  } catch (error) {
    console.error("Accept work order error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to accept work order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
