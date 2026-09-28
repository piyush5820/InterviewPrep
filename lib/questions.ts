export type InterviewQuestionData = { text: string; isCoding: boolean };

export const CODING_QUESTION_TAG = "@isCoding@";

const codingTagRe = new RegExp(`\\s*${CODING_QUESTION_TAG}\\s*`, "gi");
const hasCodingTagRe = new RegExp(CODING_QUESTION_TAG, "i");

export function stripQuestionNumber(text: string) {
  return text.replace(/^\s*\d+[.)]\s*/, "").trim();
}

export function normalizeQuestionText(text: string) {
  return stripQuestionNumber(text).replace(codingTagRe, " ").replace(/\s+/g, " ").trim();
}

export function questionFromString(rawQuestion: string): InterviewQuestionData {
  return {
    text: normalizeQuestionText(rawQuestion),
    isCoding: hasCodingTagRe.test(rawQuestion),
  };
}

export function questionFromUnknown(rawQuestion: unknown): InterviewQuestionData | null {
  if (!rawQuestion) return null;

  if (typeof rawQuestion === "string") {
    return questionFromString(rawQuestion);
  }

  if (typeof rawQuestion === "object") {
    const question = rawQuestion as Partial<InterviewQuestionData>;
    const rawText = String(question.text ?? JSON.stringify(rawQuestion));
    const text = normalizeQuestionText(rawText);
    return { text, isCoding: question.isCoding === true || hasCodingTagRe.test(rawText) };
  }

  return { text: normalizeQuestionText(String(rawQuestion)), isCoding: false };
}

export function normalizeQuestions(rawQuestions: unknown[]): InterviewQuestionData[] {
  return rawQuestions
    .map(questionFromUnknown)
    .filter((question): question is InterviewQuestionData => !!question && question.text.length > 0);
}
