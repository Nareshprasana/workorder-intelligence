import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { incidents: true } } },
    });
    return Response.json({ success: true, assets });
  } catch (error) {
    console.error("Assets API error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load assets" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
