import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const sops = await prisma.sOP.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ success: true, sops });
  } catch (error) {
    console.error("SOPs API error:", error);
    return Response.json({ success: false, error: error.message || "Failed to load SOPs" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
