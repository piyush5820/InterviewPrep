import { OpenAI } from 'openai';
import { CODING_QUESTION_TAG, normalizeQuestions, questionFromString } from "@/lib/questions";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

if (!NVIDIA_API_KEY) {
  console.warn("NVIDIA_API_KEY not configured. NVIDIA API fallback will not be available.");
}

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: NVIDIA_API_KEY || '',
  timeout: 60000,
});

type QuestionObj = { text: string; isCoding: boolean };
export type LiveInterviewEvaluation = {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  idealAnswer: string;
};

export type LiveInterviewSummary = {
  confidence: number;
  communication: number;
  language: number;
  overall: number;
  text: string;
};

export type LiveInterviewResult = {
  evaluations: LiveInterviewEvaluation[];
  summary: LiveInterviewSummary;
};

function clampScore(value: unknown): number {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return 0;
  return Math.min(10, Math.max(0, Math.round(num * 10) / 10));
}

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return null;
}

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
  try {
    const candidate = extractJsonArray(rawText) ?? rawText;
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) {
      return normalizeQuestions(parsed);
    }
  } catch {
    // fallback to lines
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map(mapLineToQuestion);
}

export async function generateQuestionsNvidia(
  jobProfile: string,
  experienceLevel: string,
  skills: [] | string,
  interviewType: string,
  language: string,
  targetCompany: string,
  focusTopics: [] | string
) {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const skillsText = Array.isArray(skills) ? skills.join(", ") : skills;
  const topicsText = Array.isArray(focusTopics) ? focusTopics.join(", ") : focusTopics;
  const CompanyName = Array.isArray(targetCompany) ? targetCompany.join(", ") : targetCompany;

  const systemInstruction = `You are an expert technical interviewer.
Return ONLY a valid JSON array of objects with the shape: {"text": string, "isCoding": boolean}.
Do not include any explanation or markdown—only the JSON array.
Use ${CODING_QUESTION_TAG} inside the text and set "isCoding": true ONLY when the candidate must write code, SQL, an algorithm, or a program in the answer.
For conceptual, architectural, design, debugging-explanation, project-explanation, or tradeoff questions, do NOT use ${CODING_QUESTION_TAG} and set "isCoding": false, even if the question mentions code, coding agents, repositories, implementation, Python, SQL, or similar technical words.
Do not use any other coding marker.
Generate 5 interview questions for the role of ${jobProfile} at ${experienceLevel} level.
Focus on the following skills: ${skillsText}.
${CompanyName ? `The questions should be suitable for interviewing at ${CompanyName}.` : ""}
${topicsText ? `Include questions covering these topics: ${topicsText}.` : ""}
Write the questions in ${language}.`;

  const prompt = [
    `Generate 5 ${interviewType} interview questions for the role of ${jobProfile} at ${experienceLevel} level.`,
    `Focus on the following skills: ${skillsText}.`,
    CompanyName && `The questions should be suitable for interviewing at ${CompanyName}.`,
    topicsText && `Include questions covering these topics: ${topicsText}.`,
    `Write the questions in ${language}.`,
    `Return only a JSON array of objects with fields: text and isCoding.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: "stepfun-ai/step-3.5-flash",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.95,
      max_tokens: 8048,
    });

    const rawText = completion.choices[0]?.message?.content || "";
    return parseQuestions(rawText);
  } catch (error) {
    console.error("NVIDIA API error in generateQuestions:", error);
    throw error;
  }
}

export async function evaluateAnswerNvidia(
  question: string,
  userAnswer: string,
  isCodingQuestion = false
) {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const prompt = `
    Evaluate this answer to the question: "${question}"
    User Answer: "${userAnswer}"
    Ignore any meaningless words (can occur due to transcript).
    
    Provide the response strictly in the following format:
    - Score: [Number from 0 to 10]
    - Feedback: [Very short, one or two sentences, concise, clear, no repetition]
    - Ideal Answer: [Very short, concise, no more than 2-3 sentences or a short code snippet if coding question]
    
    ${
      isCodingQuestion
        ? "If the question requires writing code, ensure the Ideal Answer includes a correct, short, efficient code example (no explanation, just the code)."
        : ""
    }
    
    **Keep your response concise and to the point.**
    `.trim();

  try {
    const completion = await client.chat.completions.create({
      model: "stepfun-ai/step-3.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
    });

    const rawText =
      completion.choices[0]?.message?.content || "";

    if (!rawText.includes("Score:")) {
      return `Ideal Answer: Not available\nScore: 0\nFeedback: Unable to parse evaluation response from API.`;
    }

    return rawText;
  } catch (error) {
    console.error("NVIDIA API error in evaluateAnswer:", error);
    throw error;
  }
}

export async function getIdealAnswerNvidia(question: string, isCodingQuestion = false) {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const prompt = `
Whatever you provide make sure to the Answer is very short(concise) not very detailed. no need to provide codes if not a coding question.
Provide the ideal answer for the following interview question: "${question}"
Return only the ideal answer.
${
  isCodingQuestion
    ? "If the question requires writing code, provide a correct and efficient code example."
    : ""
}`.trim();

  try {
    const completion = await client.chat.completions.create({
      model: "stepfun-ai/step-3.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 512,
    });

    const rawText =
      completion.choices[0]?.message?.content || "";
    return rawText.trim() || "Ideal answer not available.";
  } catch (error) {
    console.error("NVIDIA API error in getIdealAnswer:", error);
    throw error;
  }
}

export async function extractAnswerFromTranscript(
  question: string,
  transcript: string
): Promise<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const prompt = `Given this interview transcript, extract the candidate's answer to the following question. If the question was not directly addressed, infer the answer from relevant parts of the conversation.

Question: "${question}"

Transcript:
${transcript}

Please provide ONLY the extracted or inferred answer from the candidate, without any explanation or preamble. Just the answer itself.`;

  try {
    const completion = await client.chat.completions.create({
      model: "stepfun-ai/step-3.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      top_p: 0.95,
      max_tokens: 512,
    });

    return completion.choices[0]?.message?.content || "No answer extracted";
  } catch (error) {
    console.error("Error extracting answer from transcript:", error);
    throw error;
  }
}

export async function evaluateLiveInterviewTranscript(
  originalQuestions: string[],
  transcript: string
): Promise<LiveInterviewResult> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const prompt = `
You are evaluating a live voice interview transcript.

Planned questions (in order — there are ${originalQuestions.length} of them):
${originalQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n")}

Transcript with speaker labels (Interviewer = AI, Candidate = user):
${transcript}

Task:
1. Return EXACTLY ${originalQuestions.length} evaluation items, one per planned question, in the same order. Copy each planned question text VERBATIM into the "question" field.
2. For each planned question, extract the candidate's answer from the transcript: the Candidate turn(s) that directly follow that planned question (a brief follow-up exchange belongs to its parent planned question — fold it in, do not create extra items).
3. Do not invent answers. If the candidate never answered a planned question, use an empty string for "answer" and score it 0.
4. Score each answer 0-10 on correctness, specificity, depth, and whether it addresses that exact question.
5. "feedback": one or two concise sentences. "idealAnswer": one concise model answer.
6. Also rate the candidate's overall delivery across the whole interview, 0-10 each: confidence (composure, decisiveness, filler-word avoidance), communication (structure, clarity, relevance), language (grammar, vocabulary, fluency). Provide "overall" (mean of the three, 1 decimal) and "text" (two concise sentences summarising delivery).

Return ONLY valid JSON with this exact shape (no markdown, no wrapper text):
{
  "evaluations": [
    { "question": "...", "answer": "....", "score": 0, "feedback": "...", "idealAnswer": "..." }
  ],
  "summary": { "confidence": 0, "communication": 0, "language": 0, "overall": 0, "text": "..." }
}
`.trim();

  try {
    const completion = await client.chat.completions.create({
      model: "stepfun-ai/step-3.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      top_p: 0.95,
      max_tokens: 4096,
    });

    const rawText = completion.choices[0]?.message?.content || "";
    const jsonText = extractJsonObject(rawText) ?? extractJsonArray(rawText) ?? rawText;
    const parsed = JSON.parse(jsonText);

    // Legacy shape: bare array of evaluation items (no summary).
    const legacyItems = Array.isArray(parsed) ? parsed : parsed?.evaluations;
    if (!Array.isArray(legacyItems)) {
      throw new Error("Live evaluation response was not an array");
    }

    const evaluations: LiveInterviewEvaluation[] = originalQuestions.map((planned, index) => {
      const item = legacyItems[index] ?? {};
      return {
        question: planned,
        answer: String(item?.answer ?? "").trim(),
        score: clampScore(item?.score),
        feedback: String(item?.feedback ?? "No feedback available.").trim(),
        idealAnswer: String(item?.idealAnswer ?? "Ideal answer not available.").trim(),
      };
    });

    const rawSummary = !Array.isArray(parsed) ? parsed?.summary ?? {} : {};
    const confidence = clampScore(rawSummary?.confidence);
    const communication = clampScore(rawSummary?.communication);
    const language = clampScore(rawSummary?.language);
    const summary: LiveInterviewSummary = {
      confidence,
      communication,
      language,
      overall: Math.round(((confidence + communication + language) / 3) * 10) / 10,
      text: String(rawSummary?.text ?? "Delivery summary not available.").trim(),
    };

    return { evaluations, summary };
  } catch (error) {
    console.error("NVIDIA API error in evaluateLiveInterviewTranscript:", error);
    throw error;
  }
}

export async function scanResumeNvidia(
  resumeText: string,
  jobDescription: string,
  yearsOfExperience: number,
  companyName: string = "",
  jobTitle: string = ""
) {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const companyContext = companyName ? ` at ${companyName}` : "";
  const titleContext = jobTitle ? ` for the ${jobTitle} role` : "";

  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Your job is to be ACCURATE, not harsh or lenient. A false "missing keyword" or invented formatting issue is just as bad a failure as missing a real one — both make the report untrustworthy.
 
CONTEXT:
- Target position: ${jobTitle ? `for ${jobTitle}` : ""}${companyName ? ` at ${companyName}` : ""}
- Candidate years of experience: ${yearsOfExperience}
 
STEP 1 — BEFORE YOU FLAG ANYTHING AS MISSING:
For every keyword/requirement in the job description, search the ENTIRE resume text (all sections — summary, experience, skills, projects, education) for:
- The exact term
- Common abbreviations and expansions (JS/JavaScript, TS/TypeScript, ML/Machine Learning, K8s/Kubernetes)
- Casing/punctuation variants (node.js, NodeJS, Node.js, nodejs)
- Family/umbrella terms (if JD wants "React" and resume says "React.js", "Next.js", or "React Native", treat as present and note the specific variant found)
- Implied presence through described work (e.g., "built REST APIs with Express" implies Node.js even if not named directly — note this as an inference, not a direct match)
Only list a keyword as missing if you have checked all of the above and it is genuinely absent or only weakly implied.
 
STEP 2 — CRITICAL RULES:
1. OR vs AND: If JD says "Java or Python", having one counts. Don't flag the other.
2. DATE FORMATS: "MM/YYYY" is valid. Don't flag it. Different sections can have different date ranges (e.g., experience shows "2025–Present" while projects show "2026") — this is normal, do NOT flag it.
3. KEYWORD MATCHING: apply the variant rules from Step 1.
4. Nice-to-have keywords are NEVER listed with severity "critical" — only required/must-have keywords from the JD can be "critical".
5. EVIDENCE REQUIREMENT: every tip, issue, and missing keyword must be traceable to specific resume or JD content. If you cannot point to the specific line or section that justifies a flag, do not include it. Do not invent generic ATS advice not tied to this resume.
6. ALWAYS provide at least 2-3 improvement tips in each category (skills, toneAndStyle, content, structure) even if the score is 80+. High scores still get actionable, specific suggestions — not filler.
7. Do not contradict yourself: a skill cannot appear as "present: true" in hardSkillsMatch/softSkillsMatch AND also appear in missingKeywords.
 
STEP 3 — SCORE CALIBRATION (apply consistently):
- 90-100: nearly all required keywords present, strong quantified achievements, clean ATS-parseable formatting, no critical gaps.
- 75-89: most required keywords present, minor formatting or phrasing issues, 1-3 non-critical gaps.
- 60-74: several required keywords missing or weak alignment with seniority/years of experience, noticeable formatting risks (tables, columns, graphics, missing dates).
- 40-59: many required keywords missing, weak quantification, structural issues likely to confuse ATS parsers.
- Below 40: resume is largely misaligned with the job description or has severe parsing/structural problems.
Do not default to a score in the 70-85 range out of habit — use the full scale and justify the band with what you found in Steps 1-2.
 
STEP 4 — SELF-CHECK BEFORE RESPONDING:
Re-read your own draft output against the resume and JD one more time. Remove any flagged item you cannot point to direct evidence for. Confirm no skill is marked both present and missing. Confirm scores match the calibration bands above given what you actually listed as missing/present.
 
RETURN EXACTLY THIS JSON (no markdown fences, no commentary before or after):
{
  "matchScore": <1-100>,
  "missingKeywords": [{"keyword": "name", "severity": "critical"|"nice-to-have", "evidence": "what in the JD requires this and why it's not found in the resume"}],
  "formattingIssues": ["issue1 — must reference a specific part of the resume"],
  "hardSkillsMatch": [{"skill": "name", "present": true}],
  "softSkillsMatch": [{"skill": "name", "present": true}],
  "experienceAlignment": "analysis text comparing years of experience and seniority signals to JD requirements",
  "contentSuggestions": ["suggestion1 — must reference specific resume content"],
  "skills": { "score": <1-100>, "tips": [{"type": "good"|"improve", "tip": "text", "explanation": "text tied to specific resume content"}] },
  "toneAndStyle": { "score": <1-100>, "tips": [{"type": "good"|"improve", "tip": "text", "explanation": "text"}] },
  "content": { "score": <1-100>, "tips": [{"type": "good"|"improve", "tip": "text", "explanation": "text"}] },
  "structure": { "score": <1-100>, "tips": [{"type": "good"|"improve", "tip": "text", "explanation": "text"}] },
  "ATS": { "tips": [{"type": "good"|"improve", "tip": "text"}] }
}
 
RESUME:
${resumeText}
 
JOB DESCRIPTION:
${jobDescription}`;

  try {
    const completion = await client.chat.completions.create({
      model: "stepfun-ai/step-3.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 4096,
    });

    const rawText =
      completion.choices[0]?.message?.content || "";

    const jsonStartIndex = rawText.indexOf("{");
    const jsonEndIndex = rawText.lastIndexOf("}");
    const jsonString = rawText.slice(jsonStartIndex, jsonEndIndex + 1);

    const json = JSON.parse(jsonString);
    return json;
  } catch (error) {
    console.error("NVIDIA API error in scanResume:", error);
    throw error;
  }
}

export async function generateOptimizedResume(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  jobTitle: string,
  missingKeywords: string[]
): Promise<{ section: string; original: string; optimized: string; changes: string[] }[]> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const keywordContext = missingKeywords.length > 0
    ? `Missing keywords to potentially incorporate: ${missingKeywords.join(", ")}`
    : "";

  const companyContext = companyName ? ` at ${companyName}` : "";
  const titleContext = jobTitle ? ` for the ${jobTitle} role` : "";

  const prompt = `You are an expert ATS resume writer. Rewrite this resume to be more ATS-friendly and more competitive for the role of ${jobTitle || "the position"}${companyName ? ` at ${companyName}` : ""}.
 
${keywordContext}
 
SECTION DEFINITION:
A "section" is one of: a single work-experience entry (one employer/title/date block, including all its bullets), the Summary/Objective block, the Skills block, a single Projects entry, or the Education block. Treat each work-experience entry and each project as its own separate section — do NOT lump multiple jobs together, and do NOT split a single job's bullets into multiple sections. This granularity matters because the output is shown as a side-by-side diff per section.
 
WHAT "OPTIMIZE" MEANS (apply per section, where applicable):
- Strengthen weak or vague verbs ("worked on," "helped with," "responsible for") into specific action verbs ("built," "led," "reduced," "automated").
- Surface quantification that already exists elsewhere in the original text but is buried or unstated as a number (e.g., if the resume says "a team" and another part of the same section names a count, make it explicit). Do NOT invent metrics, percentages, or numbers that appear nowhere in the original — see Rule 4.
- Tighten run-on or passive sentences into concise, active, ATS-parseable bullet phrasing.
- Naturally work in relevant missing keywords per Rules 1-3 below, only where the underlying experience genuinely supports it.
- Standardize formatting within a section (consistent tense, consistent bullet style) without changing what the original conveys.
 
STRICT RULES YOU MUST FOLLOW:
 
1. NO DUPLICATION: Before adding any keyword, check if that keyword (or an equivalent variant) already exists anywhere in that specific section. If it does, do NOT add it again.
 
2. EQUIVALENT VARIANT RECOGNITION: "node.js" = "NodeJS" = "Node.js" = "nodejs". "React" = "React.js" = "ReactJS". "JS" = "JavaScript". "TS" = "TypeScript". Recognize these as already-present, not gaps to fill.
 
3. CONTEXTUAL RELEVANCE: Only insert keywords that are naturally relevant to that section's actual content. Do not add keywords that don't match the section's theme, seniority level, or scope of work.
 
4. KEEP IT HONEST — NO FABRICATION: Never invent companies, titles, dates, metrics, percentages, team sizes, tools, or responsibilities that are not already present or directly and unambiguously implied by the original text. Only rephrase, restructure, and surface existing content more clearly. If a missing keyword cannot be incorporated without fabricating experience, leave it out — do not force it in. When in doubt, do not add it.
 
5. "original" MUST BE VERBATIM: the "original" field must be an exact, character-for-character copy of that section's text as it appears in the source resume — no paraphrasing, no cleanup, no whitespace normalization beyond what's needed for valid JSON. This is what gets diffed against "optimized," so it must match the source exactly.
 
6. EACH SECTION IS INDEPENDENT: evaluate and rewrite each section on its own; do not let keyword usage or phrasing decisions in one section depend on another.
 
7. ONLY INCLUDE SECTIONS WITH REAL IMPROVEMENT: skip any section where you cannot make a genuine, specific improvement (e.g., a one-line address, or a section that's already strong). Do not include a section just to pad the output, and do not skip a section that has an obvious, fixable weakness (vague verbs, missing quantification that's available elsewhere, an easily-incorporated relevant keyword) just because it's tedious.
 
8. CHANGE LOG ACCURACY: every entry in "changes" must name the specific, concrete edit made (e.g., "Changed 'worked on backend' to 'built and maintained backend services'" or "Added 'TypeScript' — already used 'TS' in this section's tooling list, made explicit for ATS matching"). Never use vague, unverifiable praise like "improved clarity" or "made it stronger" with no specifics.
 
SELF-CHECK (perform before writing your final answer):
a. For each section, re-read "original" against the actual resume text — are they character-identical?
b. For each section, does "optimized" introduce any fact (employer, date, number, tool, responsibility) not traceable to the original or this same section?
c. For each section, does "optimized" repeat a keyword that was already present in "original" in some variant form?
d. Is every "changes" entry specific enough that a human could verify it by diffing original vs optimized?
e. Did you skip any section that has an obvious fixable weakness, or include any section with no real improvement?
Fix any failures found before producing the final JSON.
 
Return a JSON array, nothing else:
[{"section": "name", "original": "verbatim text", "optimized": "rewritten text", "changes": ["specific change 1", "specific change 2"]}]
 
Only the JSON array. No markdown fences, no commentary before or after.
 
RESUME:
${resumeText}
 
JOB DESCRIPTION:
${jobDescription}`;

  try {
    const completion = await client.chat.completions.create({
      model: "stepfun-ai/step-3.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 4096,
    });

    const rawText = completion.choices[0]?.message?.content || "";

    const jsonStart = rawText.indexOf("[");
    const jsonEnd = rawText.lastIndexOf("]");
    if (jsonStart === -1 || jsonEnd === -1) {
      return [];
    }

    const jsonString = rawText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any) => ({
      section: String(item?.section || "Unknown"),
      original: String(item?.original || ""),
      optimized: String(item?.optimized || ""),
      changes: Array.isArray(item?.changes) ? item.changes.map(String) : [],
    }));
  } catch (error) {
    console.error("NVIDIA API error in generateOptimizedResume:", error);
    return [];
  }
}
