import { PrismaClient } from "../../../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id, workOrderId } = await params;

    const worker = await prisma.worker.findUnique({ where: { id } });
    if (!worker) return Response.json({ error: "Worker not found." }, { status: 404 });

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        worker: { select: { id: true, name: true, location: true, status: true } },
        incident: {
          include: {
            resident: { select: { id: true, name: true, apartment: true, building: true, phone: true, email: true } },
            client: { select: { id: true, name: true, companyName: true } },
            property: { select: { id: true, name: true, propertyCode: true, address: true } },
          },
        },
        notifications: { where: { workerId: id }, orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!workOrder) return Response.json({ error: "Work order not found." }, { status: 404 });

    if (workOrder.workerId !== id) {
      return Response.json({ error: "You are not authorized to view this job." }, { status: 403 });
    }

    return Response.json({ success: true, workOrder, worker });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
