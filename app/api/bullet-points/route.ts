import { NextResponse } from "next/server";
import { chatCompletionJson } from "@/lib/openrouter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { resumeText, jobDescription, companyName, jobTitle, section } =
      await request.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "resumeText and jobDescription are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert resume writer who creates high-impact, measurable achievement bullet points. Your bullet points:
- Start with powerful action verbs
- Include specific metrics and numbers where possible
- Naturally incorporate keywords from the job description
- Follow the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]"
- Are concise (1-2 lines max)
- Sound authentic, not generic`;

    const userPrompt = `CANDIDATE RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

${companyName ? `Company: ${companyName}` : ""}
${jobTitle ? `Role: ${jobTitle}` : ""}
${section ? `Focus on section: ${section}` : ""}

Generate 8-10 high-impact bullet points. Return EXACTLY this JSON:
{
  "bulletPoints": [
    {
      "originalText": "relevant existing text from resume or context",
      "optimizedText": "high-impact bullet point with metrics",
      "skills": ["hard/soft skills this demonstrates"],
      "impact": "why this bullet point is effective",
      "metrics": ["specific numbers/percentages used"]
    }
  ],
  "missingSkillsCovered": ["skills from JD that the bullets address"],
  "generalTips": ["tip1", "tip2"]
}

Rules:
1. Each bullet must start with a different action verb
2. Include at least 2-3 bullets with quantified metrics
3. Weave in missing hard and soft skills from the job description
4. Keep bullets to 1-2 lines maximum
5. Make them specific to this candidate's experience level
6. Avoid generic statements - be specific and measurable`;

    const result = await chatCompletionJson<{
      bulletPoints: Array<{
        originalText: string;
        optimizedText: string;
        skills: string[];
        impact: string;
        metrics: string[];
      }>;
      missingSkillsCovered: string[];
      generalTips: string[];
    }>(systemPrompt, userPrompt, { temperature: 0.5, maxTokens: 3000 });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in bullet-points API:", error);
    return NextResponse.json(
      { error: "Failed to generate bullet points", details: error.message },
      { status: 500 }
    );
  }
}
