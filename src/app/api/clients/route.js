import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VALID_STATUSES = ["ACTIVE", "INACTIVE"];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    let limit = limitParam ? parseInt(limitParam, 10) : null;
    if (limit !== null && (isNaN(limit) || limit < 1)) limit = null;
    if (limit !== null && limit > 100) limit = 100;

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
      include: {
        _count: { select: { properties: true, incidents: true } },
      },
    });

    const mapped = clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      companyName: c.companyName,
      status: c.status,
      propertyCount: c._count.properties,
      incidentCount: c._count.incidents,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return Response.json({ success: true, clients: mapped });
  } catch (error) {
    console.error("Clients GET error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load clients" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();
    const companyName = body.companyName?.trim() || null;
    const rawStatus = body.status ? String(body.status).trim().toUpperCase() : "ACTIVE";

    if (!name) return Response.json({ error: "Client name is required." }, { status: 400 });
    if (!email) return Response.json({ error: "Client email is required." }, { status: 400 });
    if (!phone) return Response.json({ error: "Client phone is required." }, { status: 400 });
    if (!VALID_STATUSES.includes(rawStatus)) {
      return Response.json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    // Basic email validation
    if (!email.includes("@")) {
      return Response.json({ error: "Invalid email format." }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { name, email, phone, companyName, status: rawStatus },
    });

    return Response.json({ success: true, client }, { status: 201 });
  } catch (error) {
    console.error("Clients POST error:", error);
    return Response.json({ success: false, error: error.message || "Failed to create client" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
