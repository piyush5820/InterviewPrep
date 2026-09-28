"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import toast from "react-hot-toast";
import {
  Sparkles, Plus, Copy, CheckCircle2, Target, Brain, BarChart3,
  ChevronDown, ChevronUp, Trash2, RotateCcw, Zap,
} from "lucide-react";
import { BulletPoint } from "@/types";

interface BulletPointGeneratorProps {
  resumeText?: string;
  jobDescription?: string;
  companyName?: string;
  jobTitle?: string;
}

export default function BulletPointGenerator({
  resumeText: initialResume,
  jobDescription: initialJD,
  companyName: initialCompany,
  jobTitle: initialTitle,
}: BulletPointGeneratorProps) {
  const [user] = useAuthState(auth);
  const [resumeText, setResumeText] = useState(initialResume || "");
  const [jobDescription, setJobDescription] = useState(initialJD || "");
  const [companyName, setCompanyName] = useState(initialCompany || "");
  const [jobTitle, setJobTitle] = useState(initialTitle || "");
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);

  const generateBullets = async () => {
    if (!user) return toast.error("Please sign in");
    if (!resumeText || !jobDescription) return toast.error("Please provide resume and job description");

    setLoading(true);
    toast.loading("Generating high-impact bullet points...", { id: "bullets" });

    try {
      const response = await fetch("/api/bullet-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, companyName, jobTitle }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const mapped: BulletPoint[] = data.bulletPoints.map((b: any, i: number) => ({
        id: `bp-${i}`,
        originalText: b.originalText,
        optimizedText: b.optimizedText,
        skills: b.skills || [],
        impact: b.impact || "",
        metrics: b.metrics || [],
        accepted: false,
      }));

      setBullets(mapped);
      setMissingSkills(data.missingSkillsCovered || []);
      setTips(data.generalTips || []);
      toast.success(`Generated ${mapped.length} bullet points`, { id: "bullets" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate", { id: "bullets" });
    } finally {
      setLoading(false);
    }
  };

  const toggleAccept = (id: string) => {
    setBullets((prev) => prev.map((b) => (b.id === id ? { ...b, accepted: !b.accepted } : b)));
  };

  const copyBullet = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const copyAllAccepted = () => {
    const accepted = bullets.filter((b) => b.accepted).map((b) => `• ${b.optimizedText}`).join("\n");
    if (!accepted) return toast.error("No bullets accepted yet");
    navigator.clipboard.writeText(accepted);
    toast.success("Accepted bullets copied!");
  };

  const acceptedCount = bullets.filter((b) => b.accepted).length;

  if (!initialResume) {
    return (
      <div className="space-y-4">
        <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
          <h3 className="mb-4 flex items-center gap-2.5 font-display text-lg font-bold text-[#0f1e2e]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]"><Sparkles className="h-4 w-4" /></span>
            AI Bullet Point Generator
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-[#5a6d80]">Generate high-impact, measurable achievement bullet points tailored to your target job.</p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Your Resume</label>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                className="w-full resize-none rounded-[12px] border border-[#dde5ec] bg-white p-3 text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" rows={6} placeholder="Paste your resume..." />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Job Description</label>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                className="w-full resize-none rounded-[12px] border border-[#dde5ec] bg-white p-3 text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" rows={6} placeholder="Paste the job description..." />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Company</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="Google" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Role</label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-sm text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="Software Engineer" />
              </div>
            </div>
            <button onClick={generateBullets} disabled={loading || !resumeText || !jobDescription}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0f766e] py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Generating...</> : <><Zap className="h-5 w-5" /> Generate Bullet Points</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bullets.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[#0f1e2e]">
            <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]"><Sparkles className="h-4 w-4" /></span>
            Generated Bullet Points
            <span className="text-sm font-normal text-[#5a6d80]">({acceptedCount} accepted)</span>
          </h3>
          <div className="flex gap-2">
            <button onClick={generateBullets} disabled={loading}
              className="flex items-center gap-1 rounded-[12px] border border-[#dde5ec] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7] disabled:opacity-50">
              <RotateCcw className="h-4 w-4" /> Regenerate
            </button>
            {acceptedCount > 0 && (
              <button onClick={copyAllAccepted} className="flex items-center gap-1 rounded-[12px] border border-[#dde5ec] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                <Copy className="h-4 w-4" /> Copy {acceptedCount} Bullets
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {bullets.map((bullet) => (
          <div key={bullet.id} className={`rounded-[18px] border p-4 shadow-[0_1px_2px_rgba(15,30,46,0.06)] transition-all duration-200 ${bullet.accepted ? "border-[#0f766e]/30 bg-[#d9efea]/40" : "border-[#dde5ec] bg-white hover:border-[#0f766e]/40 hover:shadow-[0_8px_24px_-12px_rgba(15,30,46,0.25)]"}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleAccept(bullet.id)} aria-label="Accept bullet" className="mt-1 shrink-0 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
                {bullet.accepted ? <CheckCircle2 className="h-6 w-6 text-[#15803d]" /> : <div className="h-6 w-6 rounded-full border border-[#dde5ec] bg-[#f0f4f7] transition-all duration-200 hover:border-[#0f766e]" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-relaxed text-[#0f1e2e]">{bullet.optimizedText}</p>
                <p className="mt-1 text-xs italic text-[#8ca0b3]">{bullet.originalText}</p>

                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {bullet.skills.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Brain className="h-3 w-3 text-[#2e4bff]" />
                      <span className="text-xs text-[#5a6d80]">{bullet.skills.join(", ")}</span>
                    </div>
                  )}
                  {bullet.metrics.length > 0 && (
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3 text-[#15803d]" />
                      <span className="text-xs text-[#5a6d80]">{bullet.metrics.join(", ")}</span>
                    </div>
                  )}
                </div>

                {expanded === bullet.id && (
                  <div className="mt-3 rounded-[12px] border border-[#dde5ec] bg-[#f0f4f7] p-3 text-xs text-[#33475e]">
                    <p className="mb-1 font-semibold text-[#0f1e2e]">Impact Analysis</p>
                    <p>{bullet.impact}</p>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => setExpanded(expanded === bullet.id ? null : bullet.id)}
                    className="flex items-center gap-1 text-xs text-[#5a6d80] transition-colors duration-200 hover:text-[#0f766e]">
                    {expanded === bullet.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {expanded === bullet.id ? "Less" : "More"}
                  </button>
                  <button onClick={() => copyBullet(bullet.optimizedText)} className="flex items-center gap-1 text-xs text-[#5a6d80] transition-colors duration-200 hover:text-[#0f766e]">
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {missingSkills.length > 0 && (
        <div className="rounded-[18px] border border-[#2e4bff]/20 bg-[#e3e8ff]/50 p-4">
          <h4 className="mb-2 flex items-center gap-1 text-sm font-bold text-[#2e4bff]">
            <Target className="h-4 w-4" /> Skills Covered by These Bullets
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((s, i) => (
              <span key={i} className="rounded-full border border-[#2e4bff]/20 bg-[#e3e8ff] px-2 py-0.5 text-xs font-medium text-[#2e4bff]">{s}</span>
            ))}
          </div>
        </div>
      )}

      {tips.length > 0 && (
        <div className="rounded-[18px] border border-[#9a5a0a]/20 bg-[#fff0d2] p-4">
          <h4 className="mb-2 flex items-center gap-1 text-sm font-bold text-[#9a5a0a]">
            <Sparkles className="h-4 w-4" /> General Tips
          </h4>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed text-[#33475e]">
                <span className="mt-0.5 text-[#ff6a3d]">•</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
