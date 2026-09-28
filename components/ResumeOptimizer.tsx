"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  Sparkles, CheckCircle2, XCircle, RotateCcw, Copy, FileText, Target,
  Lightbulb, ChevronDown, ChevronUp, Zap, Loader2, ArrowRight, RefreshCw,
  Download, FileSearch, Layout, Menu,
} from "lucide-react";
import { OptimizeSuggestion } from "@/types";
import { SAMPLE_TEMPLATES, ResumeTemplate } from "@/lib/resumeTemplates";
import Sidebar from "./Sidebar";
import { useRouter } from "next/navigation";

function formatResumeToTemplate(resumeText: string, template: ResumeTemplate): string {
  const lines = resumeText.split("\n").filter((l) => l.trim());
  let formatted = "";
  for (const section of template.sections) {
    if (section.type === "header") {
      formatted += `${(section.content as string[]).join("\n")}\n\n`;
    } else {
      formatted += `${section.title}\n`;
      formatted += `${"=".repeat(section.title.length)}\n`;
      if (typeof section.content === "string") {
        formatted += `${section.content}\n\n`;
      } else if (Array.isArray(section.content)) {
        for (const item of section.content) {
          if (typeof item === "string") {
            formatted += `- ${item}\n`;
          } else {
            formatted += `${item.role} at ${item.company} (${item.dates})\n`;
            for (const desc of item.description) {
              formatted += `  - ${desc}\n`;
            }
          }
        }
        formatted += "\n";
      }
    }
  }
  return formatted.trim();
}

function applySuggestionToTemplate(resume: string, suggestion: OptimizeSuggestion): string {
  if (!suggestion.originalText || !suggestion.suggestedText) return resume;
  return resume.replace(suggestion.originalText, suggestion.suggestedText);
}

export default function ResumeOptimizer() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [suggestions, setSuggestions] = useState<OptimizeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [topPriority, setTopPriority] = useState("");
  const [activeTab, setActiveTab] = useState<"editor" | "suggestions">("editor");
  const [editedResume, setEditedResume] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [flashingId, setFlashingId] = useState<string | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) return toast.error("Please provide both resume and job description");

    setLoading(true);
    toast.loading("Analyzing your resume...", { id: "optimize" });

    try {
      const response = await fetch("/api/optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, companyName, jobTitle }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const mapped: OptimizeSuggestion[] = (data.suggestions || []).map((s: any, i: number) => ({
        id: `sug-${i}`,
        sectionId: s.sectionId,
        originalText: s.originalText,
        suggestedText: s.suggestedText,
        reason: s.reason,
        keywordsAdded: s.keywordsAdded || [],
        type: s.type,
        accepted: false,
      }));

      setSuggestions(mapped);
      setOverallScore(data.overallScore || data.currentScore || 0);
      setTopPriority(data.topPriority || "");
      setEditedResume(resumeText);
      setSelectedTemplate(null);
      setAppliedIds(new Set());
      setActiveTab("suggestions");
      toast.success(`Found ${mapped.length} optimization suggestions`, { id: "optimize" });
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze", { id: "optimize" });
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = (id: string) => {
    const sug = suggestions.find((s) => s.id === id);
    if (!sug || sug.accepted) return;

    const newResume = applySuggestionToTemplate(editedResume, sug);
    if (newResume !== editedResume) {
      setEditedResume(newResume);
      setFlashingId(id);
      setTimeout(() => setFlashingId(null), 1500);
    }
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, accepted: true } : s)));
    setAppliedIds((prev) => new Set(prev).add(id));
  };

  const rejectSuggestion = (id: string) => {
    const sug = suggestions.find((s) => s.id === id);
    if (!sug || !sug.accepted) return;
    const reverted = editedResume.replace(sug.suggestedText, sug.originalText);
    if (reverted !== editedResume) setEditedResume(reverted);
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, accepted: false } : s)));
    setAppliedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const revertAll = () => {
    setEditedResume(resumeText);
    setSuggestions((prev) => prev.map((s) => ({ ...s, accepted: false })));
    setAppliedIds(new Set());
    toast.success("Reverted all changes");
  };

  const handleTemplateSelect = (template: ResumeTemplate) => {
    const formatted = formatResumeToTemplate(editedResume || resumeText, template);
    setEditedResume(formatted);
    setSelectedTemplate(template);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleDownload = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups for download");
    printWindow.document.write(`
      <html><head><title>Optimized Resume</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; white-space: pre-wrap; line-height: 1.6; }
        @media print { body { padding: 0; } }
      </style></head><body>${editedResume.replace(/\n/g, "<br>")}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleRescan = () => {
    if (!jobDescription) return toast.error("No job description to re-scan against");
    if (!editedResume) return toast.error("No resume content to scan");
    sessionStorage.setItem("rescanResume", editedResume);
    sessionStorage.setItem("rescanJD", jobDescription);
    router.push("/ResumeScanner");
  };

  const acceptedCount = suggestions.filter((s) => s.accepted).length;

  const copyToClipboardFn = () => {
    navigator.clipboard.writeText(editedResume);
    toast.success("Resume copied to clipboard!");
  };

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
          <span className="font-display text-[15px] font-bold text-[#0f1e2e]">Resume Optimizer</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f3f6f8]">

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-[#0f1e2e]">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#0f766e] text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)]">
              <Sparkles className="h-6 w-6" />
            </span>
            AI Resume Optimizer
          </h1>
          <p className="mt-2 text-[#5a6d80]">Get AI suggestions and accept/reject each one to build your optimized resume</p>
        </div>

        {suggestions.length === 0 && !loading && (
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
              <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-[#0f1e2e]">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]">
                  <FileText className="h-4 w-4" />
                </span>
                Your Resume
              </h2>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                className="w-full resize-none rounded-[14px] border border-[#dde5ec] bg-white p-4 font-mono text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" rows={16} placeholder="Paste your full resume text here..." />
            </div>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
                <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-[#0f1e2e]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#e3e8ff] text-[#2e4bff]">
                    <Target className="h-4 w-4" />
                  </span>
                  Job Description
                </h2>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full resize-none rounded-[14px] border border-[#dde5ec] bg-white p-4 text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" rows={8} placeholder="Paste the job description..." />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[#dde5ec] bg-white p-4 shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
                  <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Company (optional)</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="Google" />
                </div>
                <div className="rounded-[18px] border border-[#dde5ec] bg-white p-4 shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
                  <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Role (optional)</label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="Software Engineer" />
                </div>
              </div>
              <button onClick={handleAnalyze} disabled={loading || !resumeText || !jobDescription}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0f766e] py-4 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</> : <><Sparkles className="h-5 w-5" /> Analyze & Optimize</>}
              </button>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dde5ec] bg-[#f0f4f7]/70 p-4">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full border px-4 py-2 text-sm font-bold ${overallScore >= 70 ? "border-[#15803d]/20 bg-[#dff5e3] text-[#15803d]" : overallScore >= 40 ? "border-[#027fb7]/20 bg-[#dcf1fd] text-[#027fb7]" : "border-[#9a5a0a]/20 bg-[#fff0d2] text-[#9a5a0a]"}`}>
                      Score: {overallScore}%
                    </div>
                    <span className="text-sm text-[#5a6d80]">{acceptedCount}/{suggestions.length} accepted</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handleRescan} className="flex items-center gap-1 rounded-[12px] border border-[#dde5ec] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                      <RefreshCw className="h-4 w-4" /> Re-scan
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-1 rounded-[12px] border border-[#dde5ec] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                      <Download className="h-4 w-4" /> Download
                    </button>
                    <button onClick={revertAll} className="flex items-center gap-1 rounded-[12px] border border-[#dde5ec] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                      <RotateCcw className="h-4 w-4" /> Revert All
                    </button>
                    <button onClick={copyToClipboardFn} className="flex items-center gap-1 rounded-[12px] border border-[#dde5ec] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                      <Copy className="h-4 w-4" /> Copy
                    </button>
                    <button onClick={() => { setSuggestions([]); setEditedResume(""); setResumeText(""); setSelectedTemplate(null); }} className="rounded-[12px] border border-[#dde5ec] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                      Start Over
                    </button>
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="border-b border-[#dde5ec] bg-[#d9efea]/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#063f3a]"><Layout className="h-4 w-4" /> Template: {selectedTemplate.name}</span>
                      <div className="flex gap-2">
                        {SAMPLE_TEMPLATES.filter((t) => t.id !== selectedTemplate.id).map((t) => (
                          <button key={t.id} onClick={() => handleTemplateSelect(t)}
                            className="rounded-[10px] bg-[#0f766e] px-2 py-1 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#0b5d57]">
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={printRef} className="p-4">
                  <div ref={templateRef} className="relative">
                    <textarea value={editedResume} onChange={(e) => setEditedResume(e.target.value)}
                      className="w-full resize-none rounded-[14px] border border-[#dde5ec] bg-white p-4 font-mono text-sm leading-relaxed text-[#0f1e2e] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" rows={24} />
                    {flashingId && (
                      <div className="pointer-events-none absolute inset-0 animate-pulse rounded-[14px] bg-[#0f766e]/15" style={{ animation: "flash-highlight 1.5s ease-out" }} />
                    )}
                  </div>
                </div>
              </div>

              {!selectedTemplate && suggestions.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#0f1e2e]"><Layout className="h-4 w-4 text-[#0f766e]" /> Apply a Template</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {SAMPLE_TEMPLATES.map((t) => (
                      <button key={t.id} onClick={() => handleTemplateSelect(t)}
                        className="rounded-[18px] border border-[#dde5ec] bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,30,46,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f766e]/40 hover:shadow-[0_8px_24px_-12px_rgba(15,30,46,0.25)]">
                        <p className="text-sm font-bold text-[#0f1e2e]">{t.name}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#5a6d80]">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full shrink-0 xl:w-[480px]">
              <div className="overflow-hidden rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
                <div className="border-b border-[#dde5ec] p-4">
                  <h2 className="flex items-center gap-2.5 text-lg font-bold text-[#0f1e2e]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#fff0d2] text-[#9a5a0a]">
                      <Lightbulb className="h-4 w-4" />
                    </span>
                    AI Suggestions
                  </h2>
                  {topPriority && (
                    <div className="mt-3 rounded-[14px] border border-[#9a5a0a]/20 bg-[#fff0d2] p-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#9a5a0a]">Top Priority</p>
                      <p className="text-sm leading-relaxed text-[#0f1e2e]">{topPriority}</p>
                    </div>
                  )}
                </div>
                <div className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto p-4">
                  {suggestions.map((sug) => (
                    <div key={sug.id} className={`rounded-[18px] border p-4 shadow-[0_1px_2px_rgba(15,30,46,0.06)] transition-all duration-200 ${sug.accepted ? "border-[#0f766e]/30 bg-[#d9efea]/40" : "border-[#dde5ec] bg-white hover:border-[#0f766e]/30 hover:shadow-[0_8px_24px_-12px_rgba(15,30,46,0.25)]"}`}>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${sug.type === "keyword" ? "border-[#2e4bff]/20 bg-[#e3e8ff] text-[#2e4bff]" : "border-[#0f766e]/20 bg-[#d9efea] text-[#0b5d57]"}`}>
                          {sug.type}
                        </span>
                        <div className="flex items-center gap-1">
                          {!sug.accepted ? (
                            <button onClick={() => acceptSuggestion(sug.id)} className="rounded-[10px] p-1.5 transition-all duration-200 hover:bg-[#dff5e3]" title="Accept">
                              <CheckCircle2 className="h-5 w-5 text-[#15803d]" />
                            </button>
                          ) : (
                            <button onClick={() => rejectSuggestion(sug.id)} className="rounded-[10px] p-1.5 transition-all duration-200 hover:bg-[#fde3e1]" title="Revert">
                              <XCircle className="h-5 w-5 text-[#d92d20]" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mb-1 line-clamp-2 text-xs text-[#8ca0b3]">{sug.originalText}</p>
                      <p className="line-clamp-3 text-sm font-medium leading-relaxed text-[#0f1e2e]">{sug.suggestedText}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#5a6d80]">{sug.reason}</p>
                      {sug.keywordsAdded.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {sug.keywordsAdded.map((kw, i) => (
                            <span key={i} className="rounded-full border border-[#2e4bff]/20 bg-[#e3e8ff] px-2 py-0.5 text-xs font-medium text-[#2e4bff]">+{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
