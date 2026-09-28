import { NextRequest, NextResponse } from "next/server";
import * as nvidiaApi from "@/lib/nvidia";

export async function POST(req: NextRequest) {
  try {
    const { questions, transcript } = await req.json();

    if (!questions || !transcript) {
      return NextResponse.json(
        { error: "Missing questions or transcript" },
        { status: 400 }
      );
    }

    const originalQuestions = Array.isArray(questions)
      ? questions.map((question) => String(question))
      : [];
    const transcriptText = String(transcript);
    const { evaluations, summary } = await nvidiaApi.evaluateLiveInterviewTranscript(
      originalQuestions,
      transcriptText
    );

    if (evaluations.length === 0) {
      return NextResponse.json(
        { error: "No evaluable interview turns found" },
        { status: 422 }
      );
    }

    // One slot per planned question, in order — follow-ups are folded into
    // their parent question by the evaluator, never saved as extra items.
    const evaluatedQuestions: string[] = [];
    const answers: Record<number, string> = {};
    const feedbacks: Record<number, string> = {};
    const scores: Record<number, number> = {};

    evaluations.forEach((turn, index) => {
      evaluatedQuestions[index] = turn.question || originalQuestions[index] || `Question ${index + 1}`;
      answers[index] = turn.answer || "No answer recorded";
      feedbacks[index] = [
        turn.feedback,
        turn.idealAnswer ? `Ideal Answer: ${turn.idealAnswer}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      scores[index] = turn.score;
    });

    return NextResponse.json({
      questions: evaluatedQuestions,
      answers,
      feedbacks,
      scores,
      summary,
      transcript: transcriptText,
      success: true,
    });
  } catch (error) {
    console.error("Error processing live interview:", error);
    return NextResponse.json(
      { error: "Failed to process live interview", details: String(error) },
      { status: 500 }
    );
  }
}
