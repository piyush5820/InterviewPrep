"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { saveApplication } from "../firebase/firebase";
import toast from "react-hot-toast";
import {
  Upload, FileText, Building2, Target, Clock, Search,
  CheckCircle2, XCircle, AlertCircle, Lightbulb, Brain, User,
  Sparkles, Zap, ChevronDown, ChevronUp, Loader2, Briefcase, Download, Menu,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { ATSReport, KeywordResult } from "@/types";
import { useRouter } from "next/navigation";
import resume from "@/public/dummy-resume.png";
import Image from "next/image";
import { SAMPLE_TEMPLATES, ResumeTemplate, ResumeSection } from "@/lib/resumeTemplates";

interface StreamState {
  keywordsLoaded: boolean;
  scanLoaded: boolean;
  optimizeLoaded: boolean;
  keywords?: any;
  deterministicScores?: any;
  resumeText?: string;
  llmReport?: any;
  finalMatchScore?: number;
  skills?: any;
  optimizedResume?: any;
  llmError?: string;
  optimizeError?: string;
}

const OPENROUTER_MODEL = process.env.NEXT_PUBLIC_OPENROUTER_MODEL

export default function ResumeScanner() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [extractingText, setExtractingText] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    const savedResume = sessionStorage.getItem("rescanResume");
    const savedJD = sessionStorage.getItem("rescanJD");
    if (savedResume && savedJD) {
      const blob = new Blob([savedResume], { type: "text/plain" });
      const file = new File([blob], "optimized-resume.txt", { type: "text/plain" });
      setResumeFile(file);
      setJobDescription(savedJD);
      sessionStorage.removeItem("rescanResume");
      sessionStorage.removeItem("rescanJD");
      toast.success("Resume loaded from optimizer. You can edit and scan!");
    }
  }, []);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [aiProvider, setAiProvider] = useState<"nvidia" | "openrouter" | "gemini">("openrouter");
  const [report, setReport] = useState<ATSReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingReports, setExistingReports] = useState<ATSReport[]>([]);
  const [stream, setStream] = useState<StreamState>({
    keywordsLoaded: false,
    scanLoaded: false,
    optimizeLoaded: false,
  });
  const [trackingSaved, setTrackingSaved] = useState(false);
  const [downloadTemplate, setDownloadTemplate] = useState<ResumeTemplate | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleTrackApplication = async () => {
    if (!user) return toast.error("Please sign in");
    if (!companyName || !jobTitle) return toast.error("Missing company or job title");
    try {
      const data = {
        companyName, jobTitle, jobDescription,
        jobUrl: "", location: "", salaryRange: "",
        status: "applied" as const, appliedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        notes: `Scanned on ${new Date().toLocaleDateString()} - Score: ${stream.finalMatchScore || 0}%`,
        matchScore: stream.finalMatchScore || 0,
        keywords: stream.keywords?.keywords?.filter((k: any) => !k.present)?.map((k: any) => k.keyword) || [],
        resumeText: stream.resumeText || "",
        contactEmail: "", contactName: "",
        completed: false,
      };
      console.log("Saving application:", data);
      await saveApplication(user.uid, data);
      setTrackingSaved(true);
      toast.success("Tracked in Job Tracker!");
    } catch (err) {
      console.error("Save application error:", err);
      toast.error("Failed: " + (err instanceof Error ? err.message : "unknown error"));
    }
  };

  const handleDownload = (template: ResumeTemplate) => {
    const resumeText = stream.resumeText || "";
    const optimizedSections = stream.optimizedResume || [];

    const parseResumeSections = (text: string) => {
      const sections: { type: string; title: string; content: string }[] = [];
      const lines = text.split("\n");
      let currentSection: { type: string; title: string; content: string } | null = null;

      const sectionPatterns = [
        { pattern: /^(professional\s+summary|summary|objective|profile|about)/i, type: "summary" },
        { pattern: /^(experience|work\s+experience|employment|work\s+history)/i, type: "experience" },
        { pattern: /^(education|academic)/i, type: "education" },
        { pattern: /^(skills|technical\s+skills|competencies|technologies)/i, type: "skills" },
        { pattern: /^(projects|key\s+projects|personal\s+projects)/i, type: "projects" },
        { pattern: /^(certifications?|licenses?|credentials)/i, type: "certifications" },
      ];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const matched = sectionPatterns.find(p => p.pattern.test(trimmed));
        if (matched) {
          if (currentSection) sections.push(currentSection);
          currentSection = { type: matched.type, title: trimmed, content: "" };
        } else if (currentSection) {
          currentSection.content += (currentSection.content ? "\n" : "") + trimmed;
        } else {
          if (!sections.length || sections[sections.length - 1].type !== "header") {
            sections.push({ type: "header", title: "Header", content: trimmed });
          } else {
            sections[sections.length - 1].content += "\n" + trimmed;
          }
        }
      }
      if (currentSection) sections.push(currentSection);
      return sections;
    };

    const parsedSections = parseResumeSections(resumeText);

    const findOptimized = (sectionType: string, sectionTitle: string) => {
      return optimizedSections.find(
        (o: any) => o.section?.toLowerCase().includes(sectionType.toLowerCase())
          || o.section?.toLowerCase().includes(sectionTitle.toLowerCase().replace(/\s+/g, " "))
      );
    };

    const escapeHtml = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let html = `<!DOCTYPE html><html><head><title>Optimized Resume</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; padding: 0.5in; max-width: 816px; margin: 0 auto; color: #222; }
      h1 { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 2px; }
      .header-line { font-size: 11px; color: #666; text-align: center; margin-bottom: 16px; }
      h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-bottom: 6px; margin-top: 12px; }
      .summary-text { font-size: 12px; line-height: 1.5; }
      .skill-line { font-size: 12px; line-height: 1.6; }
      .exp-item { margin-bottom: 8px; }
      .exp-header { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; font-weight: 700; }
      .exp-date { font-size: 11px; color: #666; font-weight: 400; white-space: nowrap; margin-left: 8px; }
      ul { margin: 2px 0; padding-left: 16px; font-size: 11px; line-height: 1.5; }
      li { list-style: disc; }
      .edu-line { font-size: 12px; }
      @media print { body { padding: 0; } @page { margin: 0.4in; } }
    </style></head><body>`;

    const headerSection = parsedSections.find(s => s.type === "header");
    if (headerSection) {
      const headerLines = headerSection.content.split("\n").filter(l => l.trim());
      html += `<h1>${escapeHtml(headerLines[0] || "")}</h1>`;
      if (headerLines.length > 1) {
        html += `<p class="header-line">${escapeHtml(headerLines.slice(1).join(" | "))}</p>`;
      }
    }

    for (const section of parsedSections.filter(s => s.type !== "header")) {
      const opt = findOptimized(section.type, section.title);
      const content = opt?.optimized || section.content;

      html += `<h2>${escapeHtml(section.title)}</h2>`;

      if (section.type === "summary") {
        html += `<p class="summary-text">${escapeHtml(content).replace(/\n/g, "<br>")}</p>`;
      } else if (section.type === "skills") {
        for (const line of content.split("\n").filter((l: string) => l.trim())) {
          html += `<p class="skill-line">${escapeHtml(line)}</p>`;
        }
      } else if (section.type === "experience" || section.type === "projects") {
        const blocks = content.split(/\n(?=\S)/).filter((b: string) => b.trim());
        for (const block of blocks) {
          const blockLines = block.split("\n").filter((l: string) => l.trim());
          if (blockLines.length === 0) continue;

          const headerLine = blockLines[0];
          const headerMatch = headerLine.match(/^(.+?)(?:\s*[—–-]\s*|\s+at\s+)(.+?)(?:\s*[—–-]\s*|\s*,\s*)(.+)$/i);
          if (headerMatch) {
            html += `<div class="exp-item"><div class="exp-header"><span>${escapeHtml(headerMatch[1].trim())} — ${escapeHtml(headerMatch[2].trim())}</span><span class="exp-date">${escapeHtml(headerMatch[3].trim())}</span></div><ul>`;
            for (const bullet of blockLines.slice(1)) {
              html += `<li>${escapeHtml(bullet.replace(/^[-•*]\s*/, ""))}</li>`;
            }
            html += `</ul></div>`;
          } else {
            html += `<div class="exp-item"><p style="font-size:12px;font-weight:700;">${escapeHtml(headerLine)}</p><ul>`;
            for (const bullet of blockLines.slice(1)) {
              html += `<li>${escapeHtml(bullet.replace(/^[-•*]\s*/, ""))}</li>`;
            }
            html += `</ul></div>`;
          }
        }
      } else {
        html += `<p class="edu-line">${escapeHtml(content).replace(/\n/g, "<br>")}</p>`;
      }
    }

    html += `</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return toast.error("Please allow popups for download");
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ATS: false, skills: false, toneAndStyle: false, content: false,
    structure: false, general: false, keywordAnalysis: false, optimizedResume: false,
  });

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      const q = query(collection(db, `users/${user.uid}/reports`));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ATSReport[];
      setExistingReports(fetched);
    };
    fetchReports();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setExtractedText("");
    setExtractingText(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/extract-text", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to extract text");
      }

      const data = await res.json();
      setExtractedText(data.resumeText);
      toast.success("Resume text extracted successfully!");
    } catch (error) {
      console.error("Text extraction error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to extract text from resume");
      setResumeFile(null);
    } finally {
      setExtractingText(false);
    }
  };

  const handleScan = async () => {
    if (!user) { toast.error("Please sign in to scan your resume."); return; }

    const isUnlimitedUser = user.email === "saurabhgk7@gmail.com";
    if (!isUnlimitedUser && existingReports.length >= 3) {
      toast.custom((t) => (
        <div className="w-full max-w-sm rounded-[18px] border border-[#d92d20]/20 bg-white p-4 shadow-[0_16px_40px_-16px_rgba(15,30,46,0.35)]">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#fde3e1] font-bold text-[#d92d20]">!</div>
          <p className="text-sm font-semibold text-[#0f1e2e]">Free trial limit reached</p>
          <p className="mt-1 text-xs text-[#5a6d80]">You&apos;ve used all 3 free scans. Subscribe to unlock more.</p>
          <button className="mt-2 text-xs font-bold text-[#0f766e] underline underline-offset-4" onClick={() => { toast.dismiss(t.id); router.push("/subscription"); }}>
            Go to Subscription
          </button>
        </div>
      ));
      return;
    }

    if (!resumeFile || !extractedText || !jobDescription || !companyName || !jobTitle) {
      toast.error("Please fill in all fields and upload a resume.");
      return;
    }

    setLoading(true);
    setReport(null);
    setStream({ keywordsLoaded: false, scanLoaded: false, optimizeLoaded: false });
    toast.loading("Scanning your resume...", { id: "scan" });

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("resumeText", extractedText);
      formData.append("jobDescription", jobDescription);
      formData.append("yearsOfExperience", yearsOfExperience.toString());
      formData.append("companyName", companyName);
      formData.append("jobTitle", jobTitle);
      formData.append("userId", user.uid);
      formData.append("aiProvider", aiProvider);

      const response = await fetch("/api/scan-resume", { method: "POST", body: formData });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.details || `Scan failed (${response.status})`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.type === "keywords") {
              setStream(prev => ({
                ...prev,
                keywordsLoaded: true,
                resumeText: data.resumeText,
                keywords: data.keywordAnalysis,
                deterministicScores: data.deterministicScores,
              }));
            } else if (data.type === "fallback") {
              toast(data.message, { icon: "⚠️" });
            } else if (data.type === "scan_result") {
              if (data.error) {
                setStream(prev => ({ ...prev, scanLoaded: true, llmError: data.error }));
              } else {
                setStream(prev => ({
                  ...prev,
                  scanLoaded: true,
                  llmReport: data.llmReport,
                  finalMatchScore: data.finalMatchScore,
                  skills: data.skills,
                }));
              }
            } else if (data.type === "optimized_resume") {
              if (data.error) {
                setStream(prev => ({ ...prev, optimizeLoaded: true, optimizeError: data.error }));
              } else {
                setStream(prev => ({ ...prev, optimizeLoaded: true, optimizedResume: data.optimizedResume }));
              }
            } else if (data.type === "complete") {
              toast.success("Resume scanned successfully!", { id: "scan" });
            }
          } catch { /* incomplete line, wait for more data */ }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan resume. Please try again.", { id: "scan" });
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "border border-[#15803d]/20 bg-[#dff5e3] text-[#15803d]";
    if (score >= 60) return "border border-[#027fb7]/20 bg-[#dcf1fd] text-[#027fb7]";
    return "border border-[#9a5a0a]/20 bg-[#fff0d2] text-[#9a5a0a]";
  };

  const getScoreBar = (score: number) => {
    const color = score >= 80 ? "bg-[#0f766e]" : score >= 60 ? "bg-[#027fb7]" : "bg-[#ff6a3d]";
    return (
      <div className="h-2.5 overflow-hidden rounded-full border border-[#dde5ec] bg-[#f0f4f7]">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionCard = ({ title, icon, score, children, loading: sectionLoading, sectionKey }: {
    title: string; icon: React.ReactNode; score?: number; children: React.ReactNode;
    loading?: boolean; sectionKey?: string;
  }) => {
    const isExpanded = sectionKey ? expandedSections[sectionKey] : true;
    return (
      <div className="overflow-hidden rounded-[18px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06),0_8px_24px_-12px_rgba(15,30,46,0.18)]">
        <div
          className="flex cursor-pointer items-center justify-between p-5 transition-colors duration-200 hover:bg-[#f0f4f7]/70"
          onClick={() => sectionKey && toggleSection(sectionKey)}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]">
              {icon}
            </span>
            <span className="font-semibold text-[#0f1e2e]">{title}</span>
            {sectionLoading && <Loader2 className="h-4 w-4 animate-spin text-[#8ca0b3]" />}
          </div>
          <div className="flex items-center gap-3">
            {score !== undefined && (
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${getScoreColor(score)}`}>
                {score}%
              </span>
            )}
            {sectionKey && (
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#dde5ec] bg-[#f0f4f7] text-[#33475e] transition-all duration-200">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            )}
          </div>
        </div>
        {(!sectionKey || isExpanded) && (
          <div className="space-y-3 border-t border-[#dde5ec] p-5 pt-5">
            {children}
          </div>
        )}
      </div>
    );
  };

  const TipItem = ({ tip, type, explanation }: { tip: string; type?: string; explanation?: string }) => (
    <div className="flex items-start rounded-[14px] border border-[#dde5ec] bg-white p-3.5">
      <span className={`mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border ${
        type === "good" ? "border-[#15803d]/20 bg-[#dff5e3] text-[#15803d]" : type === "bad" || type === "missing" ? "border-[#d92d20]/20 bg-[#fde3e1] text-[#d92d20]" : "border-[#027fb7]/20 bg-[#dcf1fd] text-[#027fb7]"
      }`}>
        {type === "good" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#0f1e2e]">
          {tip}
        </p>
        {explanation && <p className="mt-1 text-xs leading-relaxed text-[#5a6d80]">{explanation}</p>}
      </div>
    </div>
  );

  const LoadSkeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-5 w-3/4 rounded-[10px] bg-[#f0f4f7]" />
      <div className="h-5 w-1/2 rounded-[10px] bg-[#f0f4f7]" />
      <div className="h-5 w-2/3 rounded-[10px] bg-[#f0f4f7]" />
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-[#e2e8ef] font-sans text-[#0f1e2e]">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0f1e2e]/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {/* Main Content — elevated sheet floating above the recessed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative z-20 bg-white border border-[#dde5ec] shadow-[0_24px_64px_rgba(15,30,46,0.18),-16px_0_40px_rgba(15,30,46,0.10)] lg:rounded-[24px] lg:my-4 lg:mr-4 lg:ml-3">
        <div className="shrink-0 lg:hidden bg-white/85 backdrop-blur-md border-b border-[#dde5ec] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
            className="p-2 rounded-[10px] text-[#5a6d80] hover:text-[#0f1e2e] hover:bg-[#f0f4f7] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display text-[15px] font-bold text-[#0f1e2e]">ATS Resume Scan</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f3f6f8]">

      {/* ──── Hero Section (only before scan) ──── */}
      {!loading && !stream.keywordsLoaded && (
        <section className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0f766e]/20 bg-[#d9efea] px-4 py-2 text-sm font-semibold text-[#063f3a]">
            <Zap className="h-4 w-4" />
            AI-Powered Analysis
          </div>
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-[#0f1e2e] sm:text-5xl lg:text-6xl">
            Perfect Your Resume with
            <span className="block text-[#0f766e]">Smart AI Analysis</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-[#5a6d80] sm:text-xl">
            Get instant feedback on your resume&apos;s ATS compatibility, keyword optimization, and professional presentation to land your dream job faster.
          </p>
        </section>
      )}

      {/* ──── Form Panel (only before scan) ──── */}
      {!loading && !stream.keywordsLoaded && (
        <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)] sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#d9efea] text-[#0b5d57]">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="font-display text-2xl font-bold text-[#0f1e2e]">Resume & Job Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0f1e2e]">
                  <Building2 className="h-4 w-4 text-[#0f766e]" /> Company Name
                </label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1"
                  placeholder="e.g., Google, Microsoft, Apple" />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0f1e2e]">
                  <Target className="h-4 w-4 text-[#0f766e]" /> Job Title
                </label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1"
                  placeholder="e.g., Software Engineer, Product Manager" />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0f1e2e]">
                  <Clock className="h-4 w-4 text-[#0f766e]" /> Years of Experience
                </label>
                <input type="number" value={yearsOfExperience} onChange={e => setYearsOfExperience(Number(e.target.value))}
                  className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1"
                  placeholder="Enter years of experience" min="0" />
              </div>

              {/* AI Provider */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0f1e2e]">
                  <Sparkles className="h-4 w-4 text-[#0f766e]" /> AI Provider
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => setAiProvider("nvidia")}
                    className={`rounded-[14px] border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${
                      aiProvider === "nvidia" ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)]" : "border-[#dde5ec] bg-white hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]"
                    }`}>
                    <p className={`text-sm font-bold ${aiProvider === "nvidia" ? "text-white" : "text-[#0f1e2e]"}`}>NVIDIA</p>
                    <p className={`text-xs ${aiProvider === "nvidia" ? "text-white/70" : "text-[#5a6d80]"}`}>minimax-m2.7</p>
                  </button>
                  <button type="button" onClick={() => setAiProvider("openrouter")}
                    className={`rounded-[14px] border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${
                      aiProvider === "openrouter" ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)]" : "border-[#dde5ec] bg-white hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]"
                    }`}>
                    <p className={`text-sm font-bold ${aiProvider === "openrouter" ? "text-white" : "text-[#0f1e2e]"}`}>OpenRouter</p>
                    <p className={`truncate text-xs ${aiProvider === "openrouter" ? "text-white/70" : "text-[#5a6d80]"}`}>{OPENROUTER_MODEL}</p>
                  </button>
                  <button type="button" onClick={() => setAiProvider("gemini")}
                    className={`rounded-[14px] border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${
                      aiProvider === "gemini" ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)]" : "border-[#dde5ec] bg-white hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]"
                    }`}>
                    <p className={`text-sm font-bold ${aiProvider === "gemini" ? "text-white" : "text-[#0f1e2e]"}`}>Gemini</p>
                    <p className={`text-xs ${aiProvider === "gemini" ? "text-white/70" : "text-[#5a6d80]"}`}>gemini-2.5-flash</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0f1e2e]">
                  <FileText className="h-4 w-4 text-[#0f766e]" /> Job Description
                </label>
                <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                  className="w-full resize-none rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1"
                  rows={5} placeholder="Paste the complete job description here..." />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0f1e2e]">
                  <Upload className="h-4 w-4 text-[#0f766e]" /> Upload Resume (PDF)
                </label>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="resume-upload" />
                <label htmlFor="resume-upload"
                  className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-[18px] border border-dashed p-6 text-center transition-all duration-200 ${
                    resumeFile ? "border-[#0f766e]/30 bg-[#d9efea]/40" : "border-[#dde5ec] bg-white hover:border-[#0f766e]/50 hover:bg-[#f0f4f7]/60"
                  }`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#d9efea] text-[#0b5d57]">
                    {extractingText ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </span>
                  <p className="font-medium text-[#0f1e2e]">
                    {extractingText ? "Extracting text..." : resumeFile ? resumeFile.name : "Click to upload PDF resume"}
                  </p>
                  <p className="text-xs text-[#5a6d80]">
                    {extractingText ? "Please wait" : extractedText ? "Text extracted successfully" : "PDF files only, max 10MB"}
                  </p>
                  {extractedText && !extractingText && (
                    <p className="text-xs font-medium text-[#15803d]">Ready to scan</p>
                  )}
                </label>
              </div>

              <button onClick={handleScan} disabled={loading || !user || extractingText || !extractedText}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0f766e] px-8 py-4 text-lg font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing Resume...</>
                ) : extractingText ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Extracting Text...</>
                ) : (
                  <><Search className="h-5 w-5" /> Scan Resume</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Results Panel (only after scan starts) ──── */}
      {(loading || stream.keywordsLoaded) && (
        <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Left Column - Keywords & Scores */}
            <div className="space-y-6">
              {/* Keyword Analysis (arrives first) */}
              {(stream.keywordsLoaded || loading) && (
                <SectionCard title="Keyword Analysis" icon={<Search className="w-5 h-5" />}
                  score={stream.keywords?.overallMatch} loading={!stream.keywordsLoaded} sectionKey="keywordAnalysis">
                  {stream.keywords ? (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-[18px] border border-[#0f766e]/20 bg-[#d9efea] p-3 text-center sm:p-4">
                          <p className="font-display text-2xl font-bold text-[#063f3a]">{stream.keywords.overallMatch}%</p>
                          <p className="mt-1 text-xs text-[#0b5d57]">Overall Match</p>
                        </div>
                        <div className="rounded-[18px] border border-[#d92d20]/20 bg-[#fde3e1] p-3 text-center sm:p-4">
                          <p className="font-display text-2xl font-bold text-[#d92d20]">{stream.keywords.criticalMatch}%</p>
                          <p className="mt-1 text-xs text-[#d92d20]/80">Critical Keywords</p>
                        </div>
                        <div className="rounded-[18px] border border-[#9a5a0a]/20 bg-[#fff0d2] p-3 text-center sm:p-4">
                          <p className="font-display text-2xl font-bold text-[#9a5a0a]">{stream.keywords.importantMatch}%</p>
                          <p className="mt-1 text-xs text-[#9a5a0a]/80">Important</p>
                        </div>
                      </div>

                      {stream.keywords?.keywords && (
                        <div className="rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-4">
                          <h4 className="mb-2 flex items-center gap-2 font-bold text-[#0f1e2e]">
                            <XCircle className="h-4 w-4 text-[#d92d20]" />
                            Missing Keywords ({stream.keywords.keywords.filter((k: KeywordResult) => !k.present).length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {stream.keywords.keywords
                              .filter((k: KeywordResult) => !k.present)
                              .slice(0, 20)
                              .map((kw: KeywordResult, i: number) => (
                                <span key={i} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                  kw.importance === "critical" ? "border-[#d92d20]/20 bg-[#fde3e1] text-[#d92d20]" :
                                  kw.importance === "important" ? "border-[#9a5a0a]/20 bg-[#fff0d2] text-[#9a5a0a]" : "border-[#dde5ec] bg-white text-[#5a6d80]"
                                }`}>
                                  {kw.keyword}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {stream.keywords?.sectionScores && (
                        <div className="rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-4">
                          <h4 className="mb-2 font-bold text-[#0f1e2e]">Section Coverage</h4>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {Object.entries(stream.keywords.sectionScores).map(([section, score]) => (
                              <div key={section} className="flex items-center justify-between rounded-[12px] border border-[#dde5ec] bg-white p-2.5">
                                <span className="text-sm capitalize text-[#0f1e2e]">{section}</span>
                                <span className="text-sm font-bold text-[#0f766e]">{score as number}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <LoadSkeleton />
                  )}
                </SectionCard>
              )}

              {stream.keywordsLoaded && !trackingSaved && (
                <button onClick={handleTrackApplication}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0f766e] py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
                  <Briefcase className="h-5 w-5" /> Track This Application
                </button>
              )}
              {trackingSaved && (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#15803d]/20 bg-[#dff5e3] p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#15803d]" />
                  <span className="font-bold text-[#15803d]">Tracked in Job Tracker</span>
                </div>
              )}

              {/* Skills score (arrives with scan results) */}
              {(stream.scanLoaded || loading) && (
                <SectionCard title="Skills Analysis" icon={<Brain className="w-5 h-5" />}
                  score={stream.skills?.score} loading={!stream.scanLoaded && loading} sectionKey="skills">
                  {stream.llmError ? (
                    <p className="text-sm text-[#d92d20]">Analysis failed: {stream.llmError}</p>
                  ) : stream.skills?.tips ? (
                    stream.skills.tips.map((tip: any, i: number) => (
                      <TipItem key={i} {...tip} />
                    ))
                  ) : (
                    <LoadSkeleton />
                  )}
                </SectionCard>
              )}

              {/* Tone & Style */}
              {(stream.scanLoaded || loading) && (
                <SectionCard title="Tone & Style" icon={<Lightbulb className="w-5 h-5" />}
                  score={stream.llmReport?.toneAndStyle?.score} loading={!stream.scanLoaded && loading} sectionKey="toneAndStyle">
                  {stream.llmError ? (
                    <p className="text-sm text-[#d92d20]">Analysis failed: {stream.llmError}</p>
                  ) : stream.llmReport?.toneAndStyle?.tips ? (
                    stream.llmReport.toneAndStyle.tips.map((tip: any, i: number) => (
                      <TipItem key={i} {...tip} />
                    ))
                  ) : (
                    <LoadSkeleton />
                  )}
                </SectionCard>
              )}
            </div>

            {/* Right Column - LLM Analysis & Download */}
            <div className="space-y-6">
              {/* ATS Section */}
              {(stream.scanLoaded || loading) && (
                <SectionCard title="ATS Compatibility" icon={<FileText className="w-5 h-5" />}
                  score={stream.finalMatchScore} loading={!stream.scanLoaded && loading} sectionKey="ATS">
                  {stream.llmError ? (
                    <p className="text-sm text-[#d92d20]">Analysis failed: {stream.llmError}</p>
                  ) : stream.llmReport?.ATS?.tips ? (
                    stream.llmReport.ATS.tips.map((tip: any, i: number) => (
                      <TipItem key={i} tip={tip.tip} type={tip.type} explanation={tip.explanation} />
                    ))
                  ) : (
                    <LoadSkeleton />
                  )}
                </SectionCard>
              )}

              {/* Content */}
              {(stream.scanLoaded || loading) && (
                <SectionCard title="Content" icon={<FileText className="w-5 h-5" />}
                  score={stream.llmReport?.content?.score} loading={!stream.scanLoaded && loading} sectionKey="content">
                  {stream.llmError ? (
                    <p className="text-sm text-[#d92d20]">Analysis failed: {stream.llmError}</p>
                  ) : stream.llmReport?.content?.tips ? (
                    stream.llmReport.content.tips.map((tip: any, i: number) => (
                      <TipItem key={i} {...tip} />
                    ))
                  ) : (
                    <LoadSkeleton />
                  )}
                </SectionCard>
              )}

              {/* Structure */}
              {(stream.scanLoaded || loading) && (
                <SectionCard title="Structure" icon={<Target className="w-5 h-5" />}
                  score={stream.llmReport?.structure?.score} loading={!stream.scanLoaded && loading} sectionKey="structure">
                  {stream.llmError ? (
                    <p className="text-sm text-[#d92d20]">Analysis failed: {stream.llmError}</p>
                  ) : stream.llmReport?.structure?.tips ? (
                    stream.llmReport.structure.tips.map((tip: any, i: number) => (
                      <TipItem key={i} {...tip} />
                    ))
                  ) : (
                    <LoadSkeleton />
                  )}
                </SectionCard>
              )}

              {/* General / Experience */}
              {(stream.scanLoaded || loading) && (
                <SectionCard title="General Feedback" icon={<AlertCircle className="w-5 h-5" />}
                  loading={!stream.scanLoaded && loading} sectionKey="general">
                  {stream.llmError ? (
                    <p className="text-sm text-[#d92d20]">Analysis failed: {stream.llmError}</p>
                  ) : (
                    <>
                      {stream.llmReport?.missingKeywords?.length > 0 && (
                        <div className="rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-4">
                          <h4 className="mb-2 font-bold text-[#0f1e2e]">Missing Keywords ({stream.llmReport.missingKeywords.length})</h4>
                          <div className="space-y-2">
                            {stream.llmReport.missingKeywords.map((kw: any, i: number) => {
                              const isObject = typeof kw === 'object' && kw !== null && 'keyword' in kw;
                              const keyword = isObject ? kw.keyword : String(kw);
                              const severity = isObject ? kw.severity : null;
                              const evidence = isObject ? kw.evidence : null;
                              return (
                                <div key={i} className="rounded-[14px] border border-[#dde5ec] bg-white p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-[#d92d20]/20 bg-[#fde3e1] px-2 py-0.5 text-sm font-medium text-[#d92d20]">{keyword}</span>
                                    {severity && (
                                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                        severity === 'critical' ? 'border-[#d92d20]/20 bg-[#fde3e1] text-[#d92d20]' : 'border-[#9a5a0a]/20 bg-[#fff0d2] text-[#9a5a0a]'
                                      }`}>
                                        {severity === 'critical' ? 'CRITICAL' : 'NICE-TO-HAVE'}
                                      </span>
                                    )}
                                  </div>
                                  {evidence && <p className="mt-1.5 text-xs leading-relaxed text-[#5a6d80]">{evidence}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {stream.llmReport?.experienceAlignment && (
                        <div className="rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-4">
                          <h4 className="mb-1 font-bold text-[#0f1e2e]">Experience Alignment</h4>
                          <p className="text-sm leading-relaxed text-[#33475e]">{stream.llmReport.experienceAlignment}</p>
                        </div>
                      )}
                      {stream.llmReport?.formattingIssues?.length > 0 && (
                        <div className="rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-4">
                          <h4 className="mb-1 font-bold text-[#0f1e2e]">Formatting Issues ({stream.llmReport.formattingIssues.length})</h4>
                          <ul className="space-y-1">
                            {stream.llmReport.formattingIssues.map((issue: string, i: number) => (
                              <li key={i} className="flex items-start text-sm text-[#33475e]">
                                <span className="mr-2 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f766e]" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {stream.llmReport?.contentSuggestions?.length > 0 && (
                        <div className="rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-4">
                          <h4 className="mb-1 font-bold text-[#0f1e2e]">Content Suggestions ({stream.llmReport.contentSuggestions.length})</h4>
                          {stream.llmReport.contentSuggestions.map((s: string, i: number) => (
                            <div key={i} className="mt-1 flex items-start text-sm leading-relaxed text-[#33475e]">
                              <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-[10px] bg-[#0f766e] text-xs font-bold text-white">{i + 1}</span>
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </SectionCard>
              )}

              {/* ── Download Optimized Resume ── */}
              {stream.optimizeLoaded && !stream.optimizeError && stream.optimizedResume?.length > 0 && (
                <div className="overflow-hidden rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
                  <div className="p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#d9efea] text-[#0b5d57]">
                        <Download className="h-5 w-5" />
                      </span>
                      <span className="font-display text-lg font-bold text-[#0f1e2e]">Download Optimized Resume</span>
                    </div>

                    <p className="mb-3 text-xs font-medium text-[#5a6d80]">Choose a template:</p>
                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {SAMPLE_TEMPLATES.map(tpl => (
                        <button key={tpl.id} onClick={() => setDownloadTemplate(tpl)}
                          className={`rounded-[14px] border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${
                            downloadTemplate?.id === tpl.id
                              ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)]"
                              : "border-[#dde5ec] bg-white hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]"
                          }`}>
                          <p className={`text-xs font-bold ${downloadTemplate?.id === tpl.id ? "text-white" : "text-[#0f1e2e]"}`}>{tpl.name}</p>
                          <p className={`mt-0.5 text-[10px] leading-relaxed ${downloadTemplate?.id === tpl.id ? "text-white/70" : "text-[#5a6d80]"}`}>{tpl.description}</p>
                        </button>
                      ))}
                    </div>

                    {downloadTemplate && (
                      <button onClick={() => handleDownload(downloadTemplate)}
                        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0f766e] py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
                        <Download className="h-5 w-5" /> Download as PDF ({downloadTemplate.name})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
