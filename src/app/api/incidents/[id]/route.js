import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
        property: { select: { id: true, name: true, propertyCode: true, address: true } },
        asset: { select: { id: true, assetCode: true, name: true, category: true, location: true } },
        workOrder: { include: { worker: { select: { id: true, name: true, location: true, status: true } } } },
      },
    });
    if (!incident) return Response.json({ error: "Incident not found." }, { status: 404 });
    return Response.json({ success: true, incident });
  } catch (error) {
    return Response.json({ success: false, error: "Failed to load incident" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
