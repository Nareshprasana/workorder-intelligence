import { analyzeMaintenanceComplaint } from "../../../../lib/ai";

export async function POST(request) {
  try {
    const body = await request.json();

    const description = body.description?.trim();
    const location = body.location?.trim() || null;
    const assetCode = body.assetCode?.trim() || null;

    if (!description) {
      return Response.json(
        {
          error: "Complaint description is required.",
        },
        { status: 400 }
      );
    }

    const analysis = await analyzeMaintenanceComplaint({
      description,
      location,
      assetCode,
    });

    return Response.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("AI analysis error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "AI analysis failed.",
      },
      { status: 500 }
    );
  }
}