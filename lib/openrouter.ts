import { OpenAI } from "openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

if (!OPENROUTER_API_KEY) {
  console.warn(
    "OPENROUTER_API_KEY not configured. OpenRouter API features will not be available."
  );
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "https://preplysthub-ai.vercel.app",
    "X-Title": "PreplystHub-AI",
  },
});

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const completion = await client.chat.completions.create({
    model: options?.model || OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4096,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function scanResumeOpenRouter(
  resumeText: string,
  jobDescription: string,
  yearsOfExperience: number,
  companyName: string,
  jobTitle: string
): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const systemPrompt = "You are a precise ATS (Applicant Tracking System) resume analyzer. You evaluate resumes against job descriptions using objective, evidence-based criteria — never generic advice. Every issue or gap you report must be traceable to specific text in the resume or job description. You always respond with valid JSON only, matching exactly the schema given in the user's instructions, with no markdown formatting, code fences, or commentary outside the JSON.";

  const userPrompt = `Your job is to be ACCURATE, not harsh or lenient. A false "missing keyword" or invented formatting issue is just as bad a failure as missing a real one — both make the report untrustworthy.
 
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

  const completion = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    top_p: 0.9,
    // max_tokens: 4096,
  });

  const rawText = completion.choices[0]?.message?.content || "";
  const jsonStart = rawText.indexOf("{");
  const jsonEnd = rawText.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON found in OpenRouter response");
  }
  return JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
}

export async function chatCompletionJson<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<T> {
  const rawText = await chatCompletion(systemPrompt, userPrompt, options);
  const jsonStart = rawText.indexOf("{");
  const jsonEnd = rawText.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }
  return JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
}

export async function generateOptimizedResumeOpenRouter(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  jobTitle: string,
  missingKeywords: string[]
): Promise<{ section: string; original: string; optimized: string; changes: string[] }[]> {
  if (!OPENROUTER_API_KEY) return [];

  const keywordContext = missingKeywords.length > 0
    ? `Missing keywords to potentially incorporate: ${missingKeywords.join(", ")}`
    : "";

  const systemPrompt = `You are an expert ATS resume writer with strict quality rules.`;

  const userPrompt = `You are an expert ATS resume writer. Rewrite this resume to be more ATS-friendly and more competitive for the role of ${jobTitle || "the position"}${companyName ? ` at ${companyName}` : ""}.
 
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

  const completion = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    top_p: 0.9,
  });

  const rawText = completion.choices[0]?.message?.content || "";
  const jsonStart = rawText.indexOf("[");
  const jsonEnd = rawText.lastIndexOf("]");
  if (jsonStart === -1 || jsonEnd === -1) return [];

  const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => ({
    section: String(item?.section || "Unknown"),
    original: String(item?.original || ""),
    optimized: String(item?.optimized || ""),
    changes: Array.isArray(item?.changes) ? item.changes.map(String) : [],
  }));
}
