import { NextResponse } from "next/server";
import { chatCompletionJson } from "@/lib/openrouter";
import { analyzeKeywords } from "@/lib/keywordAnalysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { resumeText, jobDescription, companyName, jobTitle } =
      await request.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "resumeText and jobDescription are required" },
        { status: 400 }
      );
    }

    const keywordAnalysis = analyzeKeywords(resumeText, jobDescription);
    const missingKeywords = keywordAnalysis.keywords
      .filter((k) => !k.present)
      .map((k) => k.keyword);

    const resumeLower = resumeText.toLowerCase();
    const techStack: string[] = [];
    const techKeywords = ["python", "javascript", "typescript", "java", "go", "rust", "c++", "react", "angular", "vue", "node", "express", "django", "flask", "fastapi", "spring", "next", "nuxt", "docker", "kubernetes", "aws", "gcp", "azure", "sql", "mongodb", "postgres", "redis", "graphql", "rest", "git", "linux", "tailwind", "bootstrap", "sass", "redux", "jest", "cypress"];
    for (const tech of techKeywords) {
      if (resumeLower.includes(tech) || resumeLower.includes(tech.replace(/[+#]/g, ""))) {
        techStack.push(tech);
      }
    }

    const systemPrompt = `You are an expert ATS resume optimizer. Analyze the resume against the job description and provide specific, actionable suggestions. Each suggestion must reference the actual resume content. Never fabricate experience or skills. CRITICAL: Do NOT suggest technologies, tools, or frameworks that the candidate has no experience with. Only build upon their existing tech stack.`;

    const userPrompt = `RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

${companyName ? `Target Company: ${companyName}` : ""}
${jobTitle ? `Target Role: ${jobTitle}` : ""}

CANDIDATE'S DETECTED TECH STACK: ${techStack.join(", ")}
MISSING KEYWORDS detected: ${missingKeywords.join(", ")}

Provide EXACTLY this JSON array of suggestions:
{
  "suggestions": [
    {
      "sectionId": "summary|experience|skills|education|projects|other",
      "originalText": "exact text from the resume to replace",
      "suggestedText": "improved replacement text",
      "reason": "why this change helps",
      "keywordsAdded": ["keyword1", "keyword2"],
      "type": "keyword|bullet|formatting|rewrite"
    }
  ],
  "overallScore": <number 1-100>,
  "topPriority": "the single most impactful change to make"
}

STRICT RULES - FOLLOW ALL:
1. originalText must be an EXACT substring from the resume
2. suggestedText must keep the same meaning but be ATS-optimized
3. ONLY suggest technologies/tools that are in the candidate's detected tech stack. If the JD asks for Node.js but the candidate uses Python/FastAPI, suggest improving their FastAPI bullet points — do NOT suggest learning Node.js
4. NEVER suggest the same keyword or rewrite in multiple suggestions — each must be unique
5. Use strong action verbs (Led, Developed, Implemented, Optimized)
6. Quantify achievements where possible
7. Generate 5-10 high-impact suggestions, all UNIQUE in focus
8. Prioritize critical missing keywords first
9. If a keyword appears in multiple sections, suggest it only ONCE in the most relevant section`;

    const result = await chatCompletionJson<{
      suggestions: Array<{
        sectionId: string;
        originalText: string;
        suggestedText: string;
        reason: string;
        keywordsAdded: string[];
        type: string;
      }>;
      overallScore: number;
      topPriority: string;
    }>(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 4096 });

    return NextResponse.json({
      ...result,
      missingKeywords,
      currentScore: keywordAnalysis.overallMatch,
    });
  } catch (error: any) {
    console.error("Error in optimize-resume API:", error);
    return NextResponse.json(
      { error: "Failed to generate optimization suggestions", details: error.message },
      { status: 500 }
    );
  }
}
