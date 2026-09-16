import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "5", 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 5;
    if (limit > 10) limit = 10;

    const skip = (page - 1) * limit;

    const [
      total,
      pending,
      assigned,
      inProgress,
      completed,
      totalIncidents,
      recentIncidents,
    ] = await Promise.all([
      prisma.workOrder.count(),

      prisma.workOrder.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.workOrder.count({
        where: {
          status: "ASSIGNED",
        },
      }),

      prisma.workOrder.count({
        where: {
          status: "IN_PROGRESS",
        },
      }),

      prisma.workOrder.count({
        where: {
          status: "COMPLETED",
        },
      }),

      prisma.incident.count(),

      prisma.incident.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          description: true,
          location: true,
          category: true,
          issue: true,
          severity: true,
          confidence: true,
          status: true,
          recommendedAction: true,
          createdAt: true,
          asset: {
            select: {
              assetCode: true,
              name: true,
              category: true,
              location: true,
            },
          },
          workOrder: {
            select: {
              id: true,
              priority: true,
              slaHours: true,
              status: true,
              assignedAt: true,
              startedAt: true,
              completedAt: true,
              worker: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalIncidents / limit));

    // Clamp page if beyond totalPages (return empty but correct pagination)
    // Keep requested page in response for UI consistency

    return Response.json({
      total,
      pending,
      assigned,
      inProgress,
      completed,
      recentIncidents,
      pagination: {
        page,
        limit,
        total: totalIncidents,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return Response.json(
      {
        error: "Failed to load dashboard statistics",
      },
      {
        status: 500,
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
