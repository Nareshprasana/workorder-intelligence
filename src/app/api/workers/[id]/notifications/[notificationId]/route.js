import { PrismaClient } from "../../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export async function PATCH(request, { params }) {
  try {
    const { id, notificationId } = await params;

    const worker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!worker) {
      return Response.json({ error: "Worker not found." }, { status: 404 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return Response.json({ error: "Notification not found." }, { status: 404 });
    }

    if (notification.workerId !== id) {
      return Response.json(
        { error: "Notification does not belong to this worker." },
        { status: 403 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "READ" },
    });

    return Response.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
