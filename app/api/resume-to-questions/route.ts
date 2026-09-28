import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { OpenAI } from "openai";
import { CODING_QUESTION_TAG, normalizeQuestions } from "@/lib/questions";

export const runtime = "nodejs";

const groqClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File;

    if (!resumeFile || !(resumeFile instanceof File)) {
      return NextResponse.json({ error: "No resume file provided." }, { status: 400 });
    }

    if (!resumeFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    // ── Step 1: Extract text using pdf-parse (same pipeline as ATS scan) ──
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const resumeText = pdfData.text?.trim();

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from the PDF. Please ensure it is a text-based PDF." },
        { status: 422 }
      );
    }

    // ── Step 2: Generate resume-tailored questions via Groq ──
    const systemInstruction = `You are an expert technical interviewer and hiring manager.
A candidate has submitted their resume for a job interview. Your task is to generate exactly 5 high-quality, tailored interview questions SOLELY based on what is written in the candidate's resume.

Return ONLY a valid JSON object with this exact shape:
{"interviewRole": string, "questions": [{"text": string, "isCoding": boolean}]}

Infer "interviewRole" from the candidate's resume using their target/recent job title, strongest project theme, skills, and experience. Use a concise role title such as "Machine Learning Engineer", "Full Stack Developer", "Data Analyst", or "Frontend Engineer". Do not return "Resume-based Interview".
Use ${CODING_QUESTION_TAG} inside a question's text and set "isCoding": true ONLY when the candidate must write code, SQL, an algorithm, or a program in the answer.
For conceptual, architectural, design, debugging-explanation, project-explanation, or tradeoff questions, do NOT use ${CODING_QUESTION_TAG} and set "isCoding": false, even if the question mentions code, coding agents, repositories, implementation, Python, SQL, or similar technical words.
Do not use any other coding marker.
Do NOT include any explanatory text or markdown — only the JSON object.`;

    const userPrompt = `Here is the candidate's resume:\n\n${resumeText}\n\nInfer the most appropriate interview role and generate 5 tailored interview questions based strictly on this resume.`;

    const completion = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_completion_tokens: 2048,
      top_p: 1.0,
    });

    const rawText = completion.choices[0]?.message?.content || "";

    function extractJsonObject(raw: string) {
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      if (s !== -1 && e !== -1 && e > s) return raw.slice(s, e + 1);
      return null;
    }

    function extractJsonArray(raw: string) {
      const s = raw.indexOf("[");
      const e = raw.lastIndexOf("]");
      if (s !== -1 && e !== -1 && e > s) return raw.slice(s, e + 1);
      return null;
    }

    function inferRoleFallback(text: string) {
      const rolePatterns = [
        /\b(machine learning|ml)\s+engineer\b/i,
        /\b(full[-\s]?stack|full stack)\s+(developer|engineer)\b/i,
        /\b(front[-\s]?end|frontend)\s+(developer|engineer)\b/i,
        /\b(back[-\s]?end|backend)\s+(developer|engineer)\b/i,
        /\b(data scientist|data analyst|data engineer)\b/i,
        /\b(ai|artificial intelligence)\s+engineer\b/i,
        /\b(software|web|mobile|cloud|devops)\s+(developer|engineer)\b/i,
      ];

      for (const pattern of rolePatterns) {
        const match = text.match(pattern)?.[0];
        if (match) {
          return match
            .split(/[\s-]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
            .replace(/\bMl\b/, "ML")
            .replace(/\bAi\b/, "AI");
        }
      }

      return "Technical Interview";
    }

    let questions: { text: string; isCoding: boolean }[] = [];
    let interviewRole = "Technical Interview";
    try {
      const candidate = extractJsonObject(rawText) ?? rawText;
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const parsedRole = String(parsed.interviewRole || "").trim();
        interviewRole = parsedRole && !/resume[-\s]?based interview/i.test(parsedRole)
          ? parsedRole
          : inferRoleFallback(resumeText);
        questions = normalizeQuestions(Array.isArray(parsed.questions) ? parsed.questions : []).filter((q) => q.text.length > 10);
      } else if (Array.isArray(parsed)) {
        interviewRole = inferRoleFallback(resumeText);
        questions = normalizeQuestions(parsed).filter((q) => q.text.length > 10);
      }
    } catch (e) {
      const arrayCandidate = extractJsonArray(rawText);
      if (arrayCandidate) {
        try {
          questions = normalizeQuestions(JSON.parse(arrayCandidate)).filter((q) => q.text.length > 10);
        } catch {
          questions = [];
        }
      }
      if (questions.length === 0) {
        questions = normalizeQuestions(rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
          .filter((q) => q.text.length > 10);
      }
      interviewRole = inferRoleFallback(resumeText);
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "Model returned empty questions. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      questions,
      interviewRole,
      resumeText, // Pass back to client so it can be stored for Live Voice context
    });
  } catch (error: any) {
    console.error("Error in resume-to-questions route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process resume." },
      { status: 500 }
    );
  }
}
