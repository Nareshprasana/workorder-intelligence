import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        worker: { select: { id: true, name: true, location: true, status: true, skills: true } },
        incident: {
          include: {
            resident: { select: { id: true, name: true, apartment: true, building: true, phone: true } },
            client: { select: { id: true, name: true, companyName: true } },
            property: { select: { id: true, name: true, propertyCode: true, address: true } },
            asset: { select: { id: true, assetCode: true, name: true, category: true, location: true } },
          },
        },
      },
    });
    if (!workOrder) return Response.json({ error: "Work order not found." }, { status: 404 });
    return Response.json({ success: true, workOrder });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
