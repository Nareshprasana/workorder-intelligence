import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VALID_STATUSES = ["ACTIVE", "INACTIVE"];

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        properties: {
          include: {
            _count: { select: { assets: true, incidents: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { properties: true, incidents: true } },
      },
    });
    if (!client) return Response.json({ error: "Client not found." }, { status: 404 });

    // Get recent incidents for client
    const recentIncidents = await prisma.incident.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        property: { select: { id: true, name: true, propertyCode: true } },
        asset: { select: { assetCode: true, name: true } },
        workOrder: { select: { id: true, status: true, worker: { select: { name: true } } } },
      },
    });

    const openIncidents = await prisma.incident.count({
      where: { clientId: id, status: { not: "COMPLETED" } },
    });

    return Response.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        companyName: client.companyName,
        status: client.status,
        propertyCount: client._count.properties,
        incidentCount: client._count.incidents,
        openIncidents,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        properties: client.properties.map((p) => ({
          id: p.id,
          name: p.name,
          propertyCode: p.propertyCode,
          address: p.address,
          assetCount: p._count.assets,
          incidentCount: p._count.incidents,
        })),
      },
      recentIncidents,
    });
  } catch (error) {
    console.error("Client GET error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load client" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Client not found." }, { status: 404 });

    const data = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return Response.json({ error: "Client name cannot be empty." }, { status: 400 });
      data.name = name;
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim();
      if (!email || !email.includes("@")) return Response.json({ error: "Invalid email." }, { status: 400 });
      data.email = email;
    }
    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (!phone) return Response.json({ error: "Phone cannot be empty." }, { status: 400 });
      data.phone = phone;
    }
    if (body.companyName !== undefined) {
      data.companyName = String(body.companyName).trim() || null;
    }
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (!VALID_STATUSES.includes(status)) {
        return Response.json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
      }
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.client.update({ where: { id }, data });
    return Response.json({ success: true, client: updated });
  } catch (error) {
    console.error("Client PATCH error:", error);
    return Response.json({ success: false, error: error.message || "Failed to update client" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
