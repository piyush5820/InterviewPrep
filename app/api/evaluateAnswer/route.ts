import { NextRequest } from "next/server";
import * as nvidiaApi from "@/lib/nvidia";

export async function POST(req: NextRequest) {
  try {
    const { question, userAnswer, isCoding } = await req.json();
    const evaluation = await nvidiaApi.evaluateAnswerNvidia(question, userAnswer, isCoding === true);
    return Response.json({ evaluation });
  } catch (error) {
    console.error(error);
    return new Response("Failed to evaluate answer", { status: 500 });
  }
}
