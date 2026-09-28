export interface Tip {
    type: 'good' | 'improve';
    tip: string;
    explanation?: string;
  }
  
  export interface SkillMatch {
    skill: string;
    present: boolean;
  }
  
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
  
  export interface OptimizedSection {
    section: string;
    original: string;
    optimized: string;
    changes: string[];
  }
  
  export interface ATSReport {
    id: string;
    userId: string;
    jobTitle: string;
    companyName: string;
    matchScore: number;
    missingKeywords: Array<{ keyword: string; severity: "critical" | "nice-to-have"; evidence: string }>;
    formattingIssues: string[];
    contentSuggestions: string[];
    hardSkillsMatch: SkillMatch[];
    softSkillsMatch: SkillMatch[];
    experienceAlignment: string;
    resumeText: string;
    jobDescription: string;
    createdAt: string;
  
    skills: {
      score: number;
      tips: Tip[];
    };
    toneAndStyle: {
      score: number;
      tips: Tip[];
    };
    content: {
      score: number;
      tips: Tip[];
    };
    structure: {
      score: number;
      tips: Tip[];
    };
    ATS: {
      tips: Omit<Tip, 'explanation'>[];
    };
  
    keywordAnalysis?: KeywordAnalysis;
    optimizedResume?: OptimizedSection[];
  }
  
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
  }

  export type ApplicationStatus =
    | "saved"
    | "applied"
    | "screening"
    | "interview"
    | "offer"
    | "accepted"
    | "rejected"
    | "withdrawn";

  export interface JobApplication {
    id: string;
    userId: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    jobUrl: string;
    location: string;
    salaryRange: string;
    status: ApplicationStatus;
    appliedDate: string;
    lastUpdated: string;
    notes: string;
    matchScore: number;
    keywords: string[];
    resumeText: string;
    interviewDate?: string;
    followUpDate?: string;
    contactEmail?: string;
    contactName?: string;
    completed?: boolean;
    createdAt: string;
  }

  export interface JobMatch {
    jobTitle: string;
    companyName: string;
    location: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    summary: string;
    jobUrl: string;
    source: string;
  }

  export interface BulletPoint {
    id: string;
    originalText: string;
    optimizedText: string;
    skills: string[];
    impact: string;
    metrics: string[];
    accepted: boolean;
  }

  export interface ResumeSection {
    id: string;
    title: string;
    content: string;
    type: "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "other";
  }

  export interface OptimizeSuggestion {
    id: string;
    sectionId: string;
    originalText: string;
    suggestedText: string;
    reason: string;
    keywordsAdded: string[];
    type: "keyword" | "bullet" | "formatting" | "rewrite";
    accepted: boolean;
  }