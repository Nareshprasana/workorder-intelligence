import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const limitParam = searchParams.get("limit");
    let limit = limitParam ? parseInt(limitParam, 10) : null;
    if (limit !== null && (isNaN(limit) || limit < 1)) limit = null;
    if (limit !== null && limit > 100) limit = 100;

    const where = {};
    if (clientId) where.clientId = clientId;

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
      include: {
        client: { select: { id: true, name: true, status: true, companyName: true } },
        _count: { select: { assets: true, incidents: true } },
      },
    });

    // Get open incident counts per property
    const withOpenCounts = await Promise.all(
      properties.map(async (p) => {
        const open = await prisma.incident.count({
          where: { propertyId: p.id, status: { not: "COMPLETED" } },
        });
        return {
          id: p.id,
          name: p.name,
          propertyCode: p.propertyCode,
          address: p.address,
          clientId: p.clientId,
          client: p.client,
          assetCount: p._count.assets,
          incidentCount: p._count.incidents,
          openIncidents: open,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    return Response.json({ success: true, properties: withOpenCounts });
  } catch (error) {
    console.error("Properties GET error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load properties" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const propertyCode = body.propertyCode?.trim();
    const address = body.address?.trim();
    const clientId = body.clientId?.trim();

    if (!name) return Response.json({ error: "Property name is required." }, { status: 400 });
    if (!propertyCode) return Response.json({ error: "Property code is required." }, { status: 400 });
    if (!address) return Response.json({ error: "Address is required." }, { status: 400 });
    if (!clientId) return Response.json({ error: "clientId is required." }, { status: 400 });

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return Response.json({ error: "Client not found." }, { status: 404 });
    if (client.status !== "ACTIVE") {
      return Response.json({ error: "Cannot create property for inactive client." }, { status: 403 });
    }

    const existingCode = await prisma.property.findUnique({ where: { propertyCode } });
    if (existingCode) {
      return Response.json({ error: "Property code already exists." }, { status: 409 });
    }

    const property = await prisma.property.create({
      data: { name, propertyCode, address, clientId },
      include: { client: { select: { id: true, name: true } } },
    });

    return Response.json({ success: true, property }, { status: 201 });
  } catch (error) {
    console.error("Properties POST error:", error);
    if (error.code === "P2002") {
      return Response.json({ error: "Property code already exists." }, { status: 409 });
    }
    return Response.json({ success: false, error: error.message || "Failed to create property" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
