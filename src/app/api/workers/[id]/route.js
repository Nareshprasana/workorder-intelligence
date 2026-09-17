import { PrismaClient } from "../../../../generated/prisma/client";
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
      include: {
        workOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            incident: {
              include: {
                resident: { select: { id: true, name: true, apartment: true, building: true, phone: true, email: true } },
                client: { select: { id: true, name: true, companyName: true } },
                property: { select: { id: true, name: true, propertyCode: true, address: true } },
                asset: { select: { id: true, assetCode: true, name: true, category: true, location: true } },
              },
            },
          },
        },
      },
    });

    if (!worker) {
      return Response.json({ error: "Worker not found." }, { status: 404 });
    }

    return Response.json({ success: true, worker });
  } catch (error) {
    console.error("Worker GET error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to load worker" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.worker.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Worker not found." }, { status: 404 });
    }

    const data = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return Response.json({ error: "Worker name cannot be empty." }, { status: 400 });
      }
      data.name = name;
    }

    if (body.skills !== undefined) {
      const skillsArray = normalizeSkills(body.skills);
      if (skillsArray.length === 0) {
        return Response.json({ error: "At least one skill is required." }, { status: 400 });
      }
      data.skills = skillsArray.join(", ");
    }

    if (body.location !== undefined) {
      const location = String(body.location).trim();
      if (!location) {
        return Response.json({ error: "Worker location cannot be empty." }, { status: 400 });
      }
      data.location = location;
    }

    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (!VALID_STATUSES.includes(status)) {
        return Response.json(
          { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.worker.update({
      where: { id },
      data,
    });

    return Response.json({ success: true, worker: updated });
  } catch (error) {
    console.error("Worker PATCH error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to update worker" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
