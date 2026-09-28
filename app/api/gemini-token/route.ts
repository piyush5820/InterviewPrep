import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your .env file.", { status: 500 });
    }
    return Response.json({ apiKey });
  } catch (error) {
    console.error("Error in gemini-token route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
