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
    const clientId = body.clientId?.toString().trim() || null;
    const propertyId = body.propertyId?.toString().trim() || null;
    const rawAssetCode = (body.assetId ?? body.assetCode ?? null)?.toString().trim() || null;
    const reporterName = body.reporterName?.toString().trim() || null;
    const reporterEmail = body.reporterEmail?.toString().trim() || null;
    const reporterPhone = body.reporterPhone?.toString().trim() || null;

    if (!description || !location) {
      return Response.json(
        { error: "Complaint description and location are required." },
        { status: 400 }
      );
    }

    if (!clientId) {
      return Response.json({ error: "clientId is required." }, { status: 400 });
    }

    if (!propertyId) {
      return Response.json({ error: "propertyId is required." }, { status: 400 });
    }

    // Validate client
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return Response.json({ error: "Client not found." }, { status: 404 });
    }
    if (client.status !== "ACTIVE") {
      return Response.json({ error: "Client is inactive and cannot submit complaints." }, { status: 403 });
    }

    // Validate property
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return Response.json({ error: "Property not found." }, { status: 404 });
    }
    if (property.clientId !== client.id) {
      return Response.json(
        { error: "Property does not belong to the specified client." },
        { status: 403 }
      );
    }

    let asset = null;
    if (rawAssetCode) {
      asset = await prisma.asset.findUnique({
        where: { assetCode: rawAssetCode },
      });
      if (!asset) {
        return Response.json({ error: `Asset "${rawAssetCode}" was not found.` }, { status: 404 });
      }
      // Verify asset belongs to property
      if (asset.propertyId && asset.propertyId !== property.id) {
        return Response.json(
          { error: `Asset "${rawAssetCode}" does not belong to the selected property.` },
          { status: 403 }
        );
      }
      // If asset has no property yet but we want strict, allow? For prototype, if asset has no property, we treat as belonging to property? But better to reject cross-property only when propertyId is set and mismatched.
      // If asset.propertyId is null, we can still allow but we will associate incident with property; keep for backward compatibility.
      // However for security we should ensure asset's property matches propertyId if asset has a property.
    }

    const incident = await prisma.incident.create({
      data: {
        description,
        location,
        assetId: asset?.id ?? null,
        clientId: client.id,
        propertyId: property.id,
        reporterName,
        reporterEmail,
        reporterPhone,
        status: "NEW",
      },
      include: {
        client: { select: { id: true, name: true } },
        property: { select: { id: true, name: true, propertyCode: true } },
        asset: { select: { assetCode: true, name: true } },
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

// Optional GET to list incidents with client/property context (for dashboard if needed)
export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        client: { select: { id: true, name: true } },
        property: { select: { id: true, name: true, propertyCode: true } },
        asset: { select: { assetCode: true, name: true } },
      },
    });
    return Response.json({ success: true, incidents });
  } catch (error) {
    console.error("Complaint GET error:", error);
    return Response.json({ error: "Failed to load incidents" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
