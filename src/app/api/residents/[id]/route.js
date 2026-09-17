import { PrismaClient } from "../../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const resident = await prisma.resident.findUnique({
      where: { id },
      include: { incidents: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!resident) return Response.json({ error: "Resident not found." }, { status: 404 });
    return Response.json({ success: true, resident });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
