"use client";

import { useState, useRef, useCallback } from "react";
import Sidebar from "./Sidebar";
import { SAMPLE_TEMPLATES, ResumeTemplate, ResumeSection, SECTION_TYPES, SectionType } from "@/lib/resumeTemplates";
import { Download, Edit3, FileText, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Menu } from "lucide-react";

/* ──────────────────────────────────────────────
   SectionView – renders a single section
   ────────────────────────────────────────────── */
function SectionView({ section, editMode, value, onChange, onTitleChange }: {
  section: ResumeSection; editMode: boolean; value: any; onChange: (v: any) => void; onTitleChange?: (t: string) => void;
}) {
  if (section.type === "header") {
    const lines = Array.isArray(value) ? value : [""];
    return (
      <div className="mb-3 text-center">
        {editMode ? (
          <input className="mb-0.5 w-full rounded-[10px] border border-[#dde5ec] bg-[#f0f4f7] px-2 py-1 text-center text-xl font-bold text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
            value={lines[0] || ""} onChange={e => onChange([e.target.value, lines[1] || ""])} />
        ) : (
          <h1 className="font-display text-xl font-bold text-[#0f1e2e]">{lines[0]}</h1>
        )}
        <p className="text-xs text-[#5a6d80]">{lines[1]}</p>
      </div>
    );
  }

  if (section.type === "summary") {
    return (
      <div className="mb-3">
        <h2 className="mb-1 border-b border-[#dde5ec] pb-0.5 text-sm font-bold uppercase tracking-wider text-[#0f1e2e]">{section.title}</h2>
        {editMode ? (
          <textarea className="w-full resize-y rounded-[10px] border border-[#dde5ec] bg-white p-2 text-xs text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
            value={value || ""} onChange={e => onChange(e.target.value)} rows={3} />
        ) : (
          <p className="text-xs leading-relaxed text-[#33475e]">{value}</p>
        )}
      </div>
    );
  }

  if (section.type === "skills") {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="mb-3">
        <h2 className="mb-1 border-b border-[#dde5ec] pb-0.5 text-sm font-bold uppercase tracking-wider text-[#0f1e2e]">{section.title}</h2>
        {editMode ? (
          <textarea className="w-full resize-y rounded-[10px] border border-[#dde5ec] bg-white p-2 text-xs text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
            value={items.join("\n")} onChange={e => onChange(e.target.value.split("\n"))} rows={4} />
        ) : (
          <div className="space-y-0.5 text-xs">{items.map((l: string, i: number) => <p key={i} className="text-[#33475e]">{l}</p>)}</div>
        )}
      </div>
    );
  }

  if (section.type === "experience" || section.type === "projects") {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="mb-3">
        <h2 className="mb-1 border-b border-[#dde5ec] pb-0.5 text-sm font-bold uppercase tracking-wider text-[#0f1e2e]">{section.title}</h2>
        {items.map((item: any, idx: number) => (
          <div key={idx} className="mb-2">
            <div className="flex items-baseline justify-between">
              {editMode ? (
                <input className="mr-2 flex-1 rounded-[10px] border border-[#dde5ec] bg-[#f0f4f7] px-2 py-1 text-xs font-bold text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
                  value={`${item.role} — ${item.company}`}
                  onChange={e => {
                    const [role = "", company = ""] = e.target.value.split(" — ");
                    const n = [...items]; n[idx] = { ...item, role, company }; onChange(n);
                  }} />
              ) : (
                <span className="text-xs font-bold text-[#0f1e2e]">{item.role} — {item.company}</span>
              )}
              {editMode ? (
                <input className="w-28 rounded-[10px] border border-[#dde5ec] bg-[#f0f4f7] px-2 py-1 text-right text-xs text-[#33475e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
                  value={item.dates} onChange={e => {
                    const n = [...items]; n[idx] = { ...item, dates: e.target.value }; onChange(n);
                  }} />
              ) : (
                <span className="ml-2 shrink-0 text-xs text-[#5a6d80]">{item.dates}</span>
              )}
            </div>
            {editMode ? (
              <textarea className="mt-0.5 w-full resize-y rounded-[10px] border border-[#dde5ec] bg-white p-2 text-xs text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
                value={(item.description || []).join("\n")}
                onChange={e => {
                  const n = [...items]; n[idx] = { ...item, description: e.target.value.split("\n").filter((l: string) => l.trim()) }; onChange(n);
                }} rows={2} />
            ) : (
              <ul className="mt-0.5 space-y-0.5 text-xs text-[#33475e]" style={{ paddingLeft: 14 }}>
                {(item.description || []).map((d: string, di: number) => (
                  <li key={di} style={{ listStyle: "disc" }}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (section.type === "education" || section.type === "certifications") {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="mb-3">
        <h2 className="mb-1 border-b border-[#dde5ec] pb-0.5 text-sm font-bold uppercase tracking-wider text-[#0f1e2e]">{section.title}</h2>
        {editMode ? (
          <textarea className="w-full resize-y rounded-[10px] border border-[#dde5ec] bg-white p-2 text-xs text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
            value={items.join("\n")} onChange={e => onChange(e.target.value.split("\n"))} rows={2} />
        ) : (
          <div className="space-y-0.5 text-xs">{items.map((l: string, i: number) => <p key={i} className="text-[#33475e]">{l}</p>)}</div>
        )}
      </div>
    );
  }

  /* ── custom section ── */
  if (section.type === "custom") {
    const bullets = section.customBullets || [""];
    return (
      <div className="mb-3">
        {editMode ? (
          <input className="mb-1 w-full rounded-[10px] border border-[#dde5ec] bg-[#f0f4f7] px-2 py-1 text-sm font-bold uppercase tracking-wider text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
            value={section.title} onChange={e => onTitleChange?.(e.target.value)} />
        ) : (
          <h2 className="mb-1 border-b border-[#dde5ec] pb-0.5 text-sm font-bold uppercase tracking-wider text-[#0f1e2e]">{section.title}</h2>
        )}
        {editMode ? (
          <textarea className="w-full resize-y rounded-[10px] border border-[#dde5ec] bg-white p-2 text-xs text-[#0f1e2e] outline-none transition-all duration-200 focus:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
            value={bullets.join("\n")} onChange={e => {
              onChange(e.target.value.split("\n"));
            }} rows={3} />
        ) : (
          <ul className="space-y-0.5 text-xs text-[#33475e]" style={{ paddingLeft: 14 }}>
            {bullets.filter(b => b.trim()).map((b: string, i: number) => (
              <li key={i} style={{ listStyle: "disc" }}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return null;
}

/* ──────────────────────────────────────────────
   default content factory
   ────────────────────────────────────────────── */
function defaultContent(type: SectionType): any {
  switch (type) {
    case "summary": return "";
    case "skills": return [""];
    case "experience":
    case "projects": return [{ company: "", role: "", dates: "", description: [""] }];
    case "education":
    case "certifications": return [""];
    case "custom": return [""];
    default: return "";
  }
}

/* ──────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────── */
export default function ResumeBuilder() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [edited, setEdited] = useState<Record<string, any>>({});
  const [addOpen, setAddOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleSelect = (tpl: ResumeTemplate) => {
    setSelectedTemplate(tpl);
    setEditMode(false);
    setEdited({});
    setSections(tpl.sections.map(s => ({ ...s, content: JSON.parse(JSON.stringify(s.content)) })));
  };

  const getVal = useCallback((section: ResumeSection) => {
    if (section.type === "custom") return section.customBullets || [""];
    return section.title in edited ? edited[section.title] : section.content;
  }, [edited]);

  const setVal = useCallback((title: string, val: any) => {
    setEdited(prev => ({ ...prev, [title]: val }));
  }, []);

  const updateSection = (idx: number, patch: Partial<ResumeSection>) => {
    setSections(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addSection = (type: SectionType) => {
    const info = SECTION_TYPES.find(s => s.type === type);
    const newSection: ResumeSection = {
      type,
      title: info?.defaultTitle || "New Section",
      content: defaultContent(type),
      customBullets: type === "custom" ? [""] : undefined,
    };
    setSections(prev => [...prev, newSection]);
    setAddOpen(false);
  };

  const removeSection = (idx: number) => {
    const s = sections[idx];
    if (s.type === "header") return; // cannot remove header
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= sections.length) return;
    setSections(prev => {
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  };

  const handlePrint = () => window.print();

  /* ── template picker ── */
  if (!selectedTemplate) {
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
            <span className="font-display text-[15px] font-bold text-[#0f1e2e]">Resume Builder</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f3f6f8]">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-[#0f1e2e]">Resume Builder</h1>
          <p className="mb-8 mt-2 text-[#5a6d80]">Choose a clean template. Edit everything. Download as PDF.</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SAMPLE_TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => handleSelect(tpl)}
                className="rounded-[24px] border border-[#dde5ec] bg-white p-6 text-left shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f766e]/40 hover:shadow-[0_16px_40px_-16px_rgba(15,118,110,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#d9efea] text-[#0b5d57]">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-display text-lg font-bold text-[#0f1e2e]">{tpl.name}</h3>
                <p className="text-sm leading-relaxed text-[#5a6d80]">{tpl.description}</p>
              </button>
            ))}
          </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── editor view ── */
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
          <span className="font-display text-[15px] font-bold text-[#0f1e2e]">Resume Builder</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f3f6f8]">
      <div className="no-print mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => setSelectedTemplate(null)}
              className="mb-1 block text-sm font-medium text-[#5a6d80] underline decoration-[#0f766e]/40 underline-offset-4 transition-colors duration-200 hover:text-[#0f766e]">&larr; Back to templates</button>
            <h1 className="font-display text-2xl font-bold text-[#0f1e2e]">{selectedTemplate.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${
                editMode ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)]" : "border-[#dde5ec] bg-white text-[#0f1e2e] hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]"
              }`}>
              <Edit3 className="h-4 w-4" /> {editMode ? "Done Editing" : "Edit"}
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 rounded-[12px] bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>

        {/* section management bar (edit mode only) */}
        {editMode && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[14px] border border-[#dde5ec] bg-white p-3 shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-[#0f1e2e]">Sections:</span>
            <div className="relative">
              <button onClick={() => setAddOpen(!addOpen)}
                className="flex items-center gap-1 rounded-[10px] border border-[#dde5ec] bg-[#f0f4f7] px-3 py-1.5 text-xs font-bold text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#d9efea]/50">
                <Plus className="h-3 w-3" /> Add Section
              </button>
              {addOpen && (
                <div className="absolute left-0 top-full z-10 mt-2 w-56 overflow-hidden rounded-[14px] border border-[#dde5ec] bg-white shadow-[0_16px_40px_-16px_rgba(15,30,46,0.35)]">
                  {SECTION_TYPES.map(info => (
                    <button key={info.type} onClick={() => addSection(info.type)}
                      className="flex w-full items-center gap-2 border-b border-[#dde5ec] px-3 py-2 text-left text-xs font-medium text-[#33475e] transition-colors duration-200 last:border-b-0 hover:bg-[#f0f4f7] hover:text-[#0f766e]">
                      <Plus className="h-3 w-3 text-[#8ca0b3]" />
                      {info.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* resume preview */}
        <div ref={printRef} className="rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_12px_32px_-16px_rgba(15,30,46,0.25)]" style={{ maxWidth: 816, margin: "0 auto" }}>
          <div className="px-5 py-4 sm:px-7 sm:py-6">
            {sections.map((s, idx) => (
              <div key={`${s.title}-${idx}`} className="group relative">
                {/* section controls (edit mode only) */}
                {editMode && s.type !== "header" && (
                  <div className="absolute -left-10 top-0 z-10 flex flex-col items-center gap-1 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
                    <button onClick={() => moveSection(idx, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#dde5ec] bg-white text-[#33475e] shadow-sm transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7] disabled:opacity-30"
                      disabled={idx === 0}><ChevronUp className="h-3 w-3" /></button>
                    <button onClick={() => moveSection(idx, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#dde5ec] bg-white text-[#33475e] shadow-sm transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7] disabled:opacity-30"
                      disabled={idx === sections.length - 1}><ChevronDown className="h-3 w-3" /></button>
                    <button onClick={() => removeSection(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#d92d20]/20 bg-[#fde3e1] text-[#d92d20] transition-all duration-200 hover:bg-[#fde3e1]/70"><Trash2 className="h-3 w-3" /></button>
                  </div>
                )}
                <SectionView section={s} editMode={editMode}
                  value={getVal(s)}
                  onChange={(v: any) => {
                    if (s.type === "custom") {
                      updateSection(idx, { customBullets: v });
                    } else {
                      setVal(s.title, v);
                    }
                  }}
                  onTitleChange={(t) => updateSection(idx, { title: t })} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; size: letter; }
        }
      `}</style>
        </div>
      </div>
    </div>
  );
}
