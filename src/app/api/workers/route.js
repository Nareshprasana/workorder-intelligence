import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const VALID_STATUSES = ["AVAILABLE", "BUSY", "OFFLINE"];

function normalizeSkills(input) {
  if (Array.isArray(input)) {
    return input.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    let limit = limitParam ? parseInt(limitParam, 10) : null;
    if (limit !== null && (isNaN(limit) || limit < 1)) limit = null;
    if (limit !== null && limit > 100) limit = 100;

    const workers = await prisma.worker.findMany({
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
      include: {
        _count: { select: { workOrders: true } },
      },
    });

    const total = workers.length;
    // For counts, need full counts regardless of limit? Use separate count queries for accuracy
    const [available, busy, offline, totalAll] = await Promise.all([
      prisma.worker.count({ where: { status: "AVAILABLE" } }),
      prisma.worker.count({ where: { status: "BUSY" } }),
      prisma.worker.count({ where: { status: "OFFLINE" } }),
      prisma.worker.count(),
    ]);

    const mapped = workers.map((w) => ({
      id: w.id,
      name: w.name,
      skills: w.skills,
      location: w.location,
      status: w.status,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      workOrderCount: w._count.workOrders,
    }));

    return Response.json({
      success: true,
      workers: mapped,
      counts: { available, busy, offline, total: totalAll },
      total: totalAll,
    });
  } catch (error) {
    console.error("Workers GET error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to load workers" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const location = body.location?.trim();
    const rawStatus = body.status ? String(body.status).trim().toUpperCase() : "AVAILABLE";
    const skillsInput = body.skills;

    if (!name) {
      return Response.json({ error: "Worker name is required." }, { status: 400 });
    }
    if (!location) {
      return Response.json({ error: "Worker location is required." }, { status: 400 });
    }

    const skillsArray = normalizeSkills(skillsInput);
    if (skillsArray.length === 0) {
      return Response.json({ error: "At least one skill is required." }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(rawStatus)) {
      return Response.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const skills = skillsArray.join(", ");

    const worker = await prisma.worker.create({
      data: {
        name,
        skills,
        location,
        status: rawStatus,
      },
    });

    return Response.json({ success: true, worker }, { status: 201 });
  } catch (error) {
    console.error("Workers POST error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to create worker" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
