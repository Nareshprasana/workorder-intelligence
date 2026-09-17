import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export async function POST(request) {
  try {
    const body = await request.json();

    const description = body.description?.trim();
    const location = body.location?.trim();
    const residentId = body.residentId?.toString().trim() || null;

    const clientId = body.clientId?.toString().trim() || null;
    const propertyId = body.propertyId?.toString().trim() || null;
    const reporterName = body.reporterName?.toString().trim() || null;
    const reporterEmail = body.reporterEmail?.toString().trim() || null;
    const reporterPhone = body.reporterPhone?.toString().trim() || null;

    if (!description || !location) {
      return Response.json(
        { error: "Complaint description and location are required." },
        { status: 400 }
      );
    }

    let resident = null;
    let client = null;
    let property = null;

    if (residentId) {
      resident = await prisma.resident.findUnique({ where: { id: residentId } });
      if (!resident) return Response.json({ error: "Resident not found." }, { status: 404 });
      if (resident.status !== "ACTIVE") return Response.json({ error: "Resident is inactive and cannot submit complaints." }, { status: 403 });
    } else if (clientId && propertyId) {
      client = await prisma.client.findUnique({ where: { id: clientId } });
      if (!client) return Response.json({ error: "Client not found." }, { status: 404 });
      if (client.status !== "ACTIVE") return Response.json({ error: "Client is inactive and cannot submit complaints." }, { status: 403 });
      property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property) return Response.json({ error: "Property not found." }, { status: 404 });
      if (property.clientId !== client.id) return Response.json({ error: "Property does not belong to the specified client." }, { status: 403 });
    } else {
      return Response.json({ error: "residentId is required." }, { status: 400 });
    }

    const incident = await prisma.incident.create({
      data: {
        description,
        location,
        residentId: resident?.id ?? null,
        clientId: client?.id ?? null,
        propertyId: property?.id ?? null,
        reporterName: resident ? resident.name : reporterName,
        reporterEmail: resident ? resident.email : reporterEmail,
        reporterPhone: resident ? resident.phone : reporterPhone,
        status: "NEW",
      },
      include: {
        resident: { select: { id: true, name: true, apartment: true, building: true } },
        client: { select: { id: true, name: true } },
        property: { select: { id: true, name: true, propertyCode: true } },
      },
    });

    return Response.json({ success: true, incident }, { status: 201 });
  } catch (error) {
    console.error("Complaint API error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to process complaint." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        resident: { select: { id: true, name: true, apartment: true, building: true } },
        client: { select: { id: true, name: true } },
        property: { select: { id: true, name: true, propertyCode: true } },
      },
    });
    return Response.json({ success: true, incidents });
  } catch (error) {
    return Response.json({ error: "Failed to load incidents" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
