import { NextRequest } from "next/server";
import { generateQuestionsGroq } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { jobProfile, experienceLevel, skills, interviewType, language, targetCompany, focusTopics } = await req.json();
    
    // Fetch questions dynamically using the new Groq API client
    const questions = await generateQuestionsGroq(
      jobProfile,
      experienceLevel,
      skills,
      interviewType,
      language,
      targetCompany,
      focusTopics
    );

    if (!questions || questions.length === 0) {
      return new Response("Failed to generate questions. Model returned empty result.", { status: 500 });
    }

    return Response.json({ questions });
  } catch (error) {
    console.error("Error in generateQuestions route:", error);
    return new Response(
      error instanceof Error ? error.message : "Failed to generate questions due to server error.",
      { status: 500 }
    );
  }
}