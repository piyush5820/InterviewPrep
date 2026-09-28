import { NextResponse } from "next/server";
import { chatCompletionJson } from "@/lib/openrouter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { resumeText, jobDescription, companyName, jobTitle, location } =
      await request.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "resumeText and jobDescription are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert job matching analyst. Compare the candidate's resume against the job description and provide a detailed match analysis. Be specific and reference actual skills/experience from the resume.`;

    const userPrompt = `CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

${companyName ? `Company: ${companyName}` : ""}
${jobTitle ? `Position: ${jobTitle}` : ""}
${location ? `Location: ${location}` : ""}

Analyze the match and return EXACTLY this JSON:
{
  "matchScore": <number 1-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "summary": "2-3 sentence overall assessment of fit",
  "recommendation": "high" | "medium" | "low",
  "keywordsToHighlight": ["keyword1", "keyword2"],
  "interviewPrepTips": ["tip1", "tip2"]
}`;

    const result = await chatCompletionJson<{
      matchScore: number;
      matchedSkills: string[];
      missingSkills: string[];
      strengths: string[];
      concerns: string[];
      summary: string;
      recommendation: string;
      keywordsToHighlight: string[];
      interviewPrepTips: string[];
    }>(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 2048 });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in job-match API:", error);
    return NextResponse.json(
      { error: "Failed to analyze job match", details: error.message },
      { status: 500 }
    );
  }
}
