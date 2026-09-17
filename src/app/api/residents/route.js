import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const residents = await prisma.resident.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { incidents: true } } },
    });
    const total = await prisma.resident.count();
    const active = await prisma.resident.count({ where: { status: "ACTIVE" } });
    return Response.json({ success: true, residents, total, active });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const apartment = body.apartment?.trim();
    const building = body.building?.trim();
    const email = body.email?.trim() || null;
    const phone = body.phone?.trim() || null;
    const status = body.status ? String(body.status).toUpperCase() : "ACTIVE";

    if (!name) return Response.json({ error: "Resident name is required." }, { status: 400 });
    if (!apartment) return Response.json({ error: "Apartment/unit is required." }, { status: 400 });
    if (!building) return Response.json({ error: "Building/block is required." }, { status: 400 });
    if (!["ACTIVE", "INACTIVE"].includes(status)) return Response.json({ error: "Status must be ACTIVE or INACTIVE" }, { status: 400 });

    const resident = await prisma.resident.create({
      data: { name, apartment, building, email, phone, status },
    });
    return Response.json({ success: true, resident }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
