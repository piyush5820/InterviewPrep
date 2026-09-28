import { NextRequest } from "next/server";
import * as nvidiaApi from "@/lib/nvidia";

export async function POST(req: NextRequest) {
  try {
    const { question, isCoding } = await req.json();
    const idealAnswer = await nvidiaApi.getIdealAnswerNvidia(question, isCoding === true);
    return Response.json({ idealAnswer });
  } catch (error) {
    console.error(error);
    return new Response("Failed to get ideal answer", { status: 500 });
  }
}
