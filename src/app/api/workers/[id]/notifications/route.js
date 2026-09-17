import { PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const worker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!worker) {
      return Response.json({ error: "Worker not found." }, { status: 404 });
    }

    const notifications = await prisma.notification.findMany({
      where: { workerId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        workOrder: {
          include: {
            incident: {
              select: {
                id: true,
                description: true,
                location: true,
                category: true,
                issue: true,
                severity: true,
                status: true,
                resident: { select: { id: true, name: true, apartment: true, building: true } },
                asset: { select: { assetCode: true, name: true } },
              },
            },
            worker: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return Response.json({
      success: true,
      worker,
      notifications,
    });
  } catch (error) {
    console.error("Worker notifications GET error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to load notifications" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
