import { OpenAI } from "openai";
import { CODING_QUESTION_TAG, normalizeQuestions, questionFromString } from "@/lib/questions";

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NVIDIA_API_KEY;

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: GROQ_API_KEY || "",
});

// Resume-based question generation is handled directly in /api/resume-to-questions/route.ts

type QuestionObj = { text: string; isCoding: boolean };

function extractJsonArray(raw: string) {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return null;
}

function mapLineToQuestion(line: string): QuestionObj {
  return questionFromString(line);
}

function parseQuestions(rawText: string): QuestionObj[] {
  // Try JSON parsing first
  try {
    const candidate = extractJsonArray(rawText) ?? rawText;
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) {
      return normalizeQuestions(parsed);
    }
  } catch (e) {
    // fallthrough to line-splitting fallback
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map(mapLineToQuestion);
}

export async function generateQuestionsGroq(
  jobProfile: string,
  experienceLevel: string,
  skills: [] | string,
  interviewType: string,
  language: string,
  targetCompany: string,
  focusTopics: [] | string
): Promise<QuestionObj[]> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured in your .env file.");
  }

  const skillsText = Array.isArray(skills) ? skills.join(", ") : skills;
  const topicsText = Array.isArray(focusTopics) ? focusTopics.join(", ") : focusTopics;
  const companyName = Array.isArray(targetCompany) ? targetCompany.join(", ") : targetCompany;

  const systemInstruction = `You are an expert technical recruiter and interviewer.
Your task is to generate exactly 5 comprehensive interview questions of mid-high quality tailored to the candidate.
Return ONLY a valid JSON array of objects with the following shape: {"text": string, "isCoding": boolean}.
Do NOT include any explanatory text, markdown, or commentary — only the JSON array.
Use ${CODING_QUESTION_TAG} inside the text and set "isCoding": true ONLY when the candidate must write code, SQL, an algorithm, or a program in the answer.
For conceptual, architectural, design, debugging-explanation, project-explanation, or tradeoff questions, do NOT use ${CODING_QUESTION_TAG} and set "isCoding": false, even if the question mentions code, coding agents, repositories, implementation, Python, SQL, or similar technical words.
Do not use any other coding marker.
The questions must:
1. Cover both fundamental basics and advanced concepts suitable for a ${experienceLevel} level.
2. Be tailored specifically to the ${jobProfile} role.
3. Assess proficiency in the following skills: ${skillsText || "general domain skills"}.
${topicsText ? `4. Incorporate questions addressing these specific topics: ${topicsText}.` : ""}
${companyName ? `5. Reflect the technical rigor and engineering standards of ${companyName}.` : ""}
Write the questions in ${language}.`;

  try {
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Generate 5 interview questions for a ${jobProfile} role.` },
      ],
      temperature: 0.2,
      max_completion_tokens: 2048,
      top_p: 1.0,
    });

    const rawText = completion.choices[0]?.message?.content || "";
    return parseQuestions(rawText);
  } catch (error) {
    console.error("Groq API error in generateQuestions:", error);

    // Fallback to standard Groq model in case primary model fails
    try {
      console.warn("Attempting fallback with standard llama-3.3-70b-specdec...");
      const completionFallback = await client.chat.completions.create({
        model: "llama-3.3-70b-specdec",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Generate 5 interview questions for a ${jobProfile} role.` },
        ],
        temperature: 0.2,
        max_completion_tokens: 2048,
        top_p: 1.0,
      });

      const rawTextFallback = completionFallback.choices[0]?.message?.content || "";
      return parseQuestions(rawTextFallback);
    } catch (fallbackError) {
      console.error("Fallback Groq model also failed:", fallbackError);
      throw error;
    }
  }
}
