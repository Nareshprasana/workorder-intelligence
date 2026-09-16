import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "10", 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 20) limit = 20;
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");

    const where = {};
    if (status && ["NEW","ANALYZING","NEEDS_INFORMATION","READY","ASSIGNED","IN_PROGRESS","COMPLETED","REJECTED"].includes(status)) {
      where.status = status;
    }
    if (severity && ["LOW","MEDIUM","HIGH","CRITICAL"].includes(severity)) {
      where.severity = severity;
    }
    if (category && ["HVAC","ELECTRICAL","PLUMBING","LIFT","GENERAL"].includes(category)) {
      where.category = category;
    }

    const [total, incidents] = await Promise.all([
      prisma.incident.count({ where }),
      prisma.incident.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          asset: { select: { assetCode: true, name: true, category: true, location: true } },
          client: { select: { id: true, name: true } },
          property: { select: { id: true, name: true, propertyCode: true } },
          workOrder: { select: { id: true, status: true, priority: true, worker: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return Response.json({
      success: true,
      incidents,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Incidents API error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load incidents" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
