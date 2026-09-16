import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, status: true, companyName: true, email: true, phone: true } },
        assets: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { incidents: true } } },
        },
        _count: { select: { incidents: true } },
      },
    });
    if (!property) return Response.json({ error: "Property not found." }, { status: 404 });

    const [recentIncidents, openIncidents] = await Promise.all([
      prisma.incident.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          asset: { select: { assetCode: true, name: true } },
          client: { select: { id: true, name: true } },
          workOrder: { select: { id: true, status: true } },
        },
      }),
      prisma.incident.count({ where: { propertyId: id, status: { not: "COMPLETED" } } }),
    ]);

    return Response.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        propertyCode: property.propertyCode,
        address: property.address,
        clientId: property.clientId,
        client: property.client,
        assetCount: property.assets.length,
        incidentCount: property._count.incidents,
        openIncidents,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        assets: property.assets.map((a) => ({
          id: a.id,
          assetCode: a.assetCode,
          name: a.name,
          category: a.category,
          location: a.location,
          description: a.description,
          incidentCount: a._count.incidents,
        })),
      },
      recentIncidents,
    });
  } catch (error) {
    console.error("Property GET error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load property" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Property not found." }, { status: 404 });

    const data = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return Response.json({ error: "Property name cannot be empty." }, { status: 400 });
      data.name = name;
    }
    if (body.propertyCode !== undefined) {
      const code = String(body.propertyCode).trim();
      if (!code) return Response.json({ error: "Property code cannot be empty." }, { status: 400 });
      const dup = await prisma.property.findUnique({ where: { propertyCode: code } });
      if (dup && dup.id !== id) return Response.json({ error: "Property code already exists." }, { status: 409 });
      data.propertyCode = code;
    }
    if (body.address !== undefined) {
      const address = String(body.address).trim();
      if (!address) return Response.json({ error: "Address cannot be empty." }, { status: 400 });
      data.address = address;
    }
    if (body.clientId !== undefined) {
      const clientId = String(body.clientId).trim();
      if (!clientId) return Response.json({ error: "clientId cannot be empty." }, { status: 400 });
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (!client) return Response.json({ error: "Client not found." }, { status: 404 });
      if (client.status !== "ACTIVE") return Response.json({ error: "Cannot assign to inactive client." }, { status: 403 });
      data.clientId = clientId;
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.property.update({ where: { id }, data });
    return Response.json({ success: true, property: updated });
  } catch (error) {
    console.error("Property PATCH error:", error);
    return Response.json({ success: false, error: error.message || "Failed to update property" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
