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
    // Support both assetId and assetCode payload keys (both map to Asset.assetCode)
    const rawAssetCode = (body.assetId ?? body.assetCode ?? null)?.toString().trim() || null;

    if (!description || !location) {
      return Response.json(
        {
          error: "Complaint description and location are required.",
        },
        { status: 400 }
      );
    }

    let asset = null;

    if (rawAssetCode) {
      asset = await prisma.asset.findUnique({
        where: {
          assetCode: rawAssetCode,
        },
      });

      if (!asset) {
        return Response.json(
          {
            error: `Asset "${rawAssetCode}" was not found.`,
          },
          { status: 404 }
        );
      }
    }

    const incident = await prisma.incident.create({
      data: {
        description,
        location,
        assetId: asset?.id ?? null,
        status: "NEW",
      },
    });

    return Response.json(
      {
        success: true,
        incident,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Complaint API error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to process complaint.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}