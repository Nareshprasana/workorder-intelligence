import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    let limit = limitParam ? parseInt(limitParam, 10) : 20;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const where = {};
    if (status && ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        worker: { select: { id: true, name: true, location: true, status: true } },
        incident: { select: { id: true, description: true, location: true, category: true, issue: true, severity: true } },
      },
    });

    return Response.json({ success: true, workOrders });
  } catch (error) {
    console.error("WorkOrders API error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load work orders" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
