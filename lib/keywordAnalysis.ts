export interface KeywordResult {
  keyword: string;
  present: boolean;
  frequency: number;
  section: "summary" | "experience" | "skills" | "education" | "not-found";
  importance: "critical" | "important" | "nice-to-have";
}

export interface KeywordAnalysis {
  overallMatch: number;
  criticalMatch: number;
  importantMatch: number;
  totalKeywords: number;
  matchedKeywords: number;
  keywords: KeywordResult[];
  sectionScores: {
    summary: number;
    experience: number;
    skills: number;
    education: number;
  };
  keywordDensity: { keyword: string; count: number; density: string }[];
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "dare",
  "ought", "used", "this", "that", "these", "those", "i", "you", "he",
  "she", "it", "we", "they", "me", "him", "her", "us", "them", "my",
  "your", "his", "its", "our", "their", "what", "which", "who", "whom",
  "where", "when", "why", "how", "all", "each", "every", "both", "few",
  "more", "most", "other", "some", "such", "no", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "because", "if", "then",
  "about", "up", "out", "into", "through", "during", "before", "after",
  "above", "below", "between", "under", "again", "further", "once",
  "also", "here", "there", "any", "many", "well", "back", "even",
  "still", "new", "want", "tell", "use", "work", "make", "like",
  "over", "such", "take", "come", "know", "go", "get", "give",
  "day", "way", "may", "say", "said", "one", "two", "first",
  "job", "role", "position", "company", "team", "ability", "looking",
  "experience", "required", "preferred", "years", "year", "include",
  "must", "able", "strong", "good", "excellent", "proven",
  "either", "neither", "respectively", "alternatively", "option",
  "nice", "bonus", "plus", "desirable", "advantageous",
  "profile", "summary", "qualifications", "highlights", "overview",
  "professional", "background", "relevant", "technical", "skilled",
  "proficient", "expertise", "knowledge", "demonstrated", "proven",
  "extensive", "solid", "practical", "hands-on", "diverse",
  "including", "various", "multiple", "several", "within",
  "across", "along", "well", "highly", "deep",
  "develop", "developed", "development", "design", "designed",
  "implement", "implemented", "implementation", "manage", "managed",
  "management", "support", "supported", "create", "created",
  "build", "built", "maintain", "maintained", "provide",
  "provided", "responsible", "duties", "tasks", "functions",
]);

const TECH_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang",
  "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
  "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs",
  "vue.js", "nextjs", "next.js", "nuxt", "svelte", "ember", "backbone",
  "nodejs", "node.js", "express", "expressjs", "django", "flask", "fastapi",
  "spring", "springboot", "spring-boot", "rails", "ruby on rails",
  "laravel", "symfony", "asp.net", ".net", "dotnet",
  "html", "html5", "css", "css3", "sass", "scss", "less", "tailwind",
  "tailwindcss", "bootstrap", "material-ui", "mui", "chakra-ui",
  "sql", "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
  "oracle", "sqlite", "mariadb", "cassandra", "dynamodb", "cosmosdb",
  "aws", "amazon web services", "azure", "microsoft azure", "gcp",
  "google cloud", "docker", "kubernetes", "k8s", "terraform", "ansible",
  "jenkins", "ci/cd", "cicd", "github actions", "gitlab ci",
  "git", "github", "gitlab", "bitbucket", "jira", "confluence",
  "graphql", "rest", "restful", "api", "apis", "microservices",
  "machine learning", "ml", "deep learning", "dl", "nlp",
  "natural language processing", "computer vision", "cv",
  "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn",
  "pandas", "numpy", "scipy", "matplotlib",
  "agile", "scrum", "kanban", "jira", "sprint",
  "linux", "unix", "bash", "shell", "powershell",
  "figma", "sketch", "adobe xd", "photoshop", "illustrator",
  "salesforce", "hubspot", "zendesk", "jira", "servicenow",
  "blockchain", "web3", "solidity", "ethereum",
  "devops", "sre", "site reliability",
  "data engineering", "etl", "airflow", "spark", "hadoop",
  "tableau", "power bi", "looker", "data analytics",
  "cybersecurity", "information security", "penetration testing",
];

const SOFT_SKILLS = [
  "leadership", "communication", "teamwork", "collaboration",
  "problem solving", "problem-solving", "analytical", "critical thinking",
  "time management", "project management", "management",
  "adaptability", "flexibility", "creativity", "innovation",
  "attention to detail", "detail-oriented", "self-motivated",
  "interpersonal", "presentation", "negotiation", "mentoring",
  "stakeholder management", "cross-functional", "strategic",
  "customer focus", "results driven", "data driven",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\+\#\.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function extractPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  const phrases: string[] = [];

  const techPatterns = [
    /react\.?js|reactjs/g, /next\.?js|nextjs/g, /vue\.?js|vuejs/g,
    /node\.?js|nodejs/g, /angular\.?js|angularjs/g,
    /machine\s+learning/g, /deep\s+learning/g, /natural\s+language\s+processing/g,
    /computer\s+vision/g, /data\s+science/g, /data\s+engineering/g,
    /web\s+development/g, /front[\s-]?end/g, /back[\s-]?end/g, /full[\s-]?stack/g,
    /cloud\s+computing/g, /amazon\s+web\s+services/g, /google\s+cloud/g,
    /microsoft\s+azure/g, /continuous\s+integration/g, /continuous\s+delivery/g,
    /problem[\s-]?solving/g, /time\s+management/g, /project\s+management/g,
    /attention\s+to\s+detail/g, /stakeholder\s+management/g,
    /cross[\s-]?functional/g, /results[\s-]?driven/g, /data[\s-]?driven/g,
    /customer[\s-]?focus/g, /self[\s-]?motivated/g, /detail[\s-]?oriented/g,
    /team\s+player/g, /critical\s+thinking/g, /strategic\s+thinking/g,
    /c\+\+/g, /c#/g, /\.net/g, /asp\.net/g, /ruby\s+on\s+rails/g,
    /ci\/cd/g, /devops/g, /site\s+reliability/g, /information\s+security/g,
    /penetration\s+testing/g, /agile\s+methodology/g, /scrum\s+master/g,
    /power\s+bi/g, /adobe\s+xd/g, /version\s+control/g,
  ];

  for (const pattern of techPatterns) {
    const matches = lower.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = match.trim();
        if (cleaned.length > 2 && !phrases.includes(cleaned)) {
          phrases.push(cleaned);
        }
      }
    }
  }

  return phrases;
}

function classifyImportance(
  keyword: string,
  jdTokens: string[],
  totalJdTokens: number,
  fullJdText: string
): "critical" | "important" | "nice-to-have" {
  const frequency = jdTokens.filter((t) => t === keyword.toLowerCase()).length;
  const relativeFreq = frequency / totalJdTokens;

  const lowerJd = fullJdText.toLowerCase();
  const kwLower = keyword.toLowerCase();

  const orIndicators = ["or", "either", "alternatively", "one of", "any of", "such as", "like"];
  const niceToHaveIndicators = ["nice to have", "nice-to-have", "bonus", "plus", "preferred", "desirable", "optional", "advantageous"];

  for (const indicator of niceToHaveIndicators) {
    const idx = lowerJd.indexOf(indicator);
    if (idx !== -1) {
      const surrounding = lowerJd.slice(Math.max(0, idx - 200), Math.min(lowerJd.length, idx + 200));
      if (surrounding.includes(kwLower)) {
        return "nice-to-have";
      }
    }
  }

  for (const indicator of orIndicators) {
    const pattern = new RegExp(`${kwLower}\\s*(?:,\\s*)?${indicator}\\b|${indicator}\\b\\s*(?:,\\s*)?${kwLower}`, "gi");
    if (pattern.test(lowerJd)) {
      if (frequency >= 3) return "important";
      return "nice-to-have";
    }
  }

  if (TECH_SKILLS.includes(kwLower)) {
    if (relativeFreq > 0.008 || frequency >= 4) return "critical";
    if (frequency >= 2) return "important";
    return "nice-to-have";
  }

  if (SOFT_SKILLS.includes(kwLower)) {
    return frequency >= 3 ? "important" : "nice-to-have";
  }

  if (relativeFreq > 0.01 || frequency >= 5) return "critical";
  if (frequency >= 3) return "important";
  return "nice-to-have";
}

function findSection(
  keyword: string,
  resumeText: string
): "summary" | "experience" | "skills" | "education" | "not-found" {
  const lower = resumeText.toLowerCase();
  const kw = keyword.toLowerCase();

  if (!lower.includes(kw)) return "not-found";

  const sectionPatterns = [
    {
      section: "summary" as const,
      patterns: [/summary/gi, /objective/gi, /profile/gi, /about/gi, /overview/gi],
    },
    {
      section: "experience" as const,
      patterns: [/experience/gi, /employment/gi, /work history/gi, /professional background/gi],
    },
    {
      section: "skills" as const,
      patterns: [/skills/gi, /technical skills/gi, /competencies/gi, /technologies/gi, /proficiencies/gi],
    },
    {
      section: "education" as const,
      patterns: [/education/gi, /academic/gi, /degree/gi, /university/gi, /college/gi],
    },
  ];

  const sections: { section: string; start: number; end: number }[] = [];

  for (const { section, patterns } of sectionPatterns) {
    for (const pattern of patterns) {
      const match = pattern.exec(lower);
      if (match) {
        sections.push({ section, start: match.index, end: lower.length });
      }
    }
  }

  sections.sort((a, b) => a.start - b.start);
  for (let i = 0; i < sections.length; i++) {
    sections[i].end = i + 1 < sections.length ? sections[i + 1].start : lower.length;
  }

  const kwIndex = lower.indexOf(kw);
  if (kwIndex === -1) return "not-found";

  for (const s of sections) {
    if (kwIndex >= s.start && kwIndex < s.end) {
      return s.section as "summary" | "experience" | "skills" | "education";
    }
  }

  return "summary";
}

export function analyzeKeywords(
  resumeText: string,
  jobDescription: string
): KeywordAnalysis {
  const jdTokens = tokenize(jobDescription);
  const resumeTokens = tokenize(resumeText);
  const jdPhrases = extractPhrases(jobDescription);
  const resumeLower = resumeText.toLowerCase();

  const keywordFreq = new Map<string, number>();
  for (const token of jdTokens) {
    if (!STOP_WORDS.has(token) && token.length > 1) {
      keywordFreq.set(token, (keywordFreq.get(token) || 0) + 1);
    }
  }
  for (const phrase of jdPhrases) {
    keywordFreq.set(phrase, (keywordFreq.get(phrase) || 0) + 2);
  }

  const sortedKeywords = [...keywordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  const keywords: KeywordResult[] = sortedKeywords.map(([keyword, freq]) => {
    const present = resumeLower.includes(keyword.toLowerCase());
    const frequency = present
      ? (resumeLower.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length
      : 0;

    return {
      keyword,
      present,
      frequency,
      section: findSection(keyword, resumeText),
      importance: classifyImportance(keyword, jdTokens, jdTokens.length, jobDescription),
    };
  });

  const matchedKeywords = keywords.filter((k) => k.present).length;
  const totalKeywords = keywords.length;
  const overallMatch = totalKeywords > 0 ? Math.round((matchedKeywords / totalKeywords) * 100) : 0;

  const criticalKeywords = keywords.filter((k) => k.importance === "critical");
  const criticalMatch =
    criticalKeywords.length > 0
      ? Math.round(
          (criticalKeywords.filter((k) => k.present).length / criticalKeywords.length) * 100
        )
      : 100;

  const importantKeywords = keywords.filter((k) => k.importance === "important");
  const importantMatch =
    importantKeywords.length > 0
      ? Math.round(
          (importantKeywords.filter((k) => k.present).length / importantKeywords.length) * 100
        )
      : 100;

  const sectionScores = { summary: 0, experience: 0, skills: 0, education: 0 };
  const sectionCounts = { summary: 0, experience: 0, skills: 0, education: 0 };

  for (const kw of keywords) {
    if (kw.present && kw.section !== "not-found") {
      sectionCounts[kw.section]++;
    }
  }

  const sectionsWithKeywords = new Set(keywords.filter((k) => k.present && k.section !== "not-found").map((k) => k.section));
  for (const section of Object.keys(sectionCounts) as Array<keyof typeof sectionCounts>) {
    const totalInSection = keywords.filter((k) => k.section === section).length;
    sectionScores[section] =
      totalInSection > 0 ? Math.round((sectionCounts[section] / totalInSection) * 100) : 
      sectionsWithKeywords.has(section) ? 80 : 50;
  }

  const keywordDensity = keywords
    .filter((k) => k.present)
    .map((k) => ({
      keyword: k.keyword,
      count: k.frequency,
      density: ((k.frequency / Math.max(resumeTokens.length, 1)) * 100).toFixed(2) + "%",
    }));

  return {
    overallMatch,
    criticalMatch,
    importantMatch,
    totalKeywords,
    matchedKeywords,
    keywords,
    sectionScores,
    keywordDensity,
  };
}

export function computeDeterministicScore(analysis: KeywordAnalysis): {
  keywordScore: number;
  sectionScore: number;
  criticalPenalty: number;
} {
  const keywordScore = Math.round(
    analysis.overallMatch * 0.5 +
    analysis.criticalMatch * 0.3 +
    analysis.importantMatch * 0.2
  );

  const sectionAvg = Math.round(
    (analysis.sectionScores.summary +
      analysis.sectionScores.experience +
      analysis.sectionScores.skills +
      analysis.sectionScores.education) / 4
  );

  const criticalPenalty = analysis.criticalMatch < 50 ? 10 : analysis.criticalMatch < 70 ? 5 : 0;

  const sectionScore = sectionAvg;

  return { keywordScore, sectionScore, criticalPenalty };
}
