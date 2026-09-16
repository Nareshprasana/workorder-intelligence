import { gemini, GEMINI_MODEL } from "../../../../lib/ai";

export async function GET() {
  try {
    const response = await gemini.interactions.create({
      model: GEMINI_MODEL,
      input: "Reply with exactly: Gemini connection works",
    });

    return Response.json({
      success: true,
      model: GEMINI_MODEL,
      response: response.output_text,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}