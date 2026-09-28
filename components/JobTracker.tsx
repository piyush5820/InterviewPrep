"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase";
import {
  saveApplication,
  getApplications,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
} from "../firebase/firebase";
import toast from "react-hot-toast";
import {
  Plus, Search, Building2, MapPin, DollarSign, Calendar, ExternalLink,
  Trash2, Edit3, ChevronDown, ChevronUp, Filter, Clock, CheckCircle2,
  XCircle, AlertCircle, Send, Eye, Star, Menu, X, Home,
  Briefcase, TrendingUp, FileText, Target, Sparkles,
} from "lucide-react";
import { JobApplication, ApplicationStatus } from "@/types";
import Sidebar from "./Sidebar";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: any }> = {
  saved: { label: "Saved", color: "bg-white text-[#5a6d80] border-[#dde5ec]", icon: Eye },
  applied: { label: "Applied", color: "bg-[#dcf1fd] text-[#027fb7] border-[#027fb7]/20", icon: Send },
  screening: { label: "Screening", color: "bg-[#fff0d2] text-[#9a5a0a] border-[#9a5a0a]/20", icon: Search },
  interview: { label: "Interview", color: "bg-[#e3e8ff] text-[#2e4bff] border-[#2e4bff]/20", icon: Calendar },
  offer: { label: "Offer", color: "bg-[#ffe8dd] text-[#d9552b] border-[#d9552b]/20", icon: Star },
  accepted: { label: "Accepted", color: "bg-[#dff5e3] text-[#15803d] border-[#15803d]/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-[#fde3e1] text-[#d92d20] border-[#d92d20]/20", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "bg-[#f0f4f7] text-[#0f1e2e] border-[#0f1e2e]/15", icon: AlertCircle },
};

const STATUS_OPTIONS: ApplicationStatus[] = ["saved", "applied", "screening", "interview", "offer", "accepted", "rejected", "withdrawn"];

export default function JobTracker() {
  const [user] = useAuthState(auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchAttempted = useRef(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [matchLoading, setMatchLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    jobTitle: "",
    jobDescription: "",
    jobUrl: "",
    location: "",
    salaryRange: "",
    status: "saved" as ApplicationStatus,
    notes: "",
    contactEmail: "",
    contactName: "",
  });

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const apps = await getApplications(user.uid);
      setApplications(apps);
    } catch {
      if (!fetchAttempted.current) {
        toast.error("Failed to load applications", { id: "fetch-apps" });
        fetchAttempted.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAttempted.current = false;
    fetchApplications();
  }, [fetchApplications]);

  const resetForm = () => {
    setFormData({
      companyName: "", jobTitle: "", jobDescription: "", jobUrl: "",
      location: "", salaryRange: "", status: "saved", notes: "",
      contactEmail: "", contactName: "",
    });
    setEditingApp(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!user) return toast.error("Please sign in");
    if (!formData.companyName || !formData.jobTitle) return toast.error("Company and job title required");

    toast.loading(editingApp ? "Updating application..." : "Adding application...", { id: "app" });

    try {
      if (editingApp) {
        await updateApplication(user.uid, editingApp.id, {
          ...formData,
          lastUpdated: new Date().toISOString(),
        });
        toast.success("Application updated!", { id: "app" });
      } else {
        await saveApplication(user.uid, {
          ...formData,
          appliedDate: formData.status === "applied" ? new Date().toISOString() : "",
          lastUpdated: new Date().toISOString(),
          matchScore: 0,
          keywords: [],
          resumeText: "",
        });
        toast.success("Application added!", { id: "app" });
      }
      resetForm();
      fetchApplications();
    } catch {
      toast.error("Failed to save application", { id: "app" });
    }
  };

  const handleDelete = async (appId: string) => {
    if (!user) return;
    if (!confirm("Delete this application?")) return;
    try {
      await deleteApplication(user.uid, appId);
      toast.success("Application deleted");
      fetchApplications();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleStatusChange = async (appId: string, status: ApplicationStatus) => {
    if (!user) return;
    try {
      await updateApplicationStatus(user.uid, appId, status);
      toast.success("Status updated");
      fetchApplications();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleToggleComplete = async (app: JobApplication) => {
    if (!user) return;
    try {
      await updateApplication(user.uid, app.id, { completed: !app.completed });
      fetchApplications();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleMatchAnalysis = async (app: JobApplication) => {
    if (!user) return;
    setMatchLoading(app.id);
    toast.loading("Analyzing job match...", { id: "match" });

    try {
      const response = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: app.resumeText || "No resume text provided",
          jobDescription: app.jobDescription,
          companyName: app.companyName,
          jobTitle: app.jobTitle,
          location: app.location,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      await updateApplication(user.uid, app.id, {
        matchScore: data.matchScore,
        keywords: data.keywordsToHighlight || [],
      });

      toast.success(`Match score: ${data.matchScore}%`, { id: "match" });
      fetchApplications();
    } catch {
      toast.error("Failed to analyze match", { id: "match" });
    } finally {
      setMatchLoading(null);
    }
  };

  const filtered = applications.filter((app) => {
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        app.companyName.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q) ||
        app.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: applications.length,
    active: applications.filter((a) => ["applied", "screening", "interview"].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer" || a.status === "accepted").length,
    avgMatch: applications.length > 0
      ? Math.round(applications.reduce((acc, a) => acc + (a.matchScore || 0), 0) / applications.length)
      : 0,
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f8] p-4">
        <div className="max-w-md rounded-[24px] border border-[#dde5ec] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#d9efea] text-[#0b5d57]">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="mb-3 font-display text-2xl font-bold text-[#0f1e2e]">Job Application Tracker</h2>
          <p className="text-[#5a6d80]">Sign in to track and manage your job applications.</p>
        </div>
      </div>
    );
  }

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
          <span className="font-display text-[15px] font-bold text-[#0f1e2e]">Job Tracker</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f3f6f8]">

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-[#0f1e2e]">Job Applications</h1>
            <p className="mt-1 text-lg text-[#5a6d80]">Track, manage, and optimize your job search pipeline</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="inline-flex items-center gap-2 rounded-[14px] bg-[#0f766e] px-6 py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
          >
            <Plus className="h-5 w-5" /> Add Application
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Total", value: stats.total, icon: Briefcase, tile: "bg-[#d9efea] text-[#0b5d57]" },
            { label: "Active", value: stats.active, icon: Send, tile: "bg-[#dcf1fd] text-[#027fb7]" },
            { label: "Interviews", value: stats.interviews, icon: Calendar, tile: "bg-[#e3e8ff] text-[#2e4bff]" },
            { label: "Offers", value: stats.offers, icon: Star, tile: "bg-[#ffe8dd] text-[#d9552b]" },
            { label: "Avg Match", value: `${stats.avgMatch}%`, icon: Target, tile: "bg-[#dff5e3] text-[#15803d]" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[18px] border border-[#dde5ec] bg-white p-5 shadow-[0_1px_2px_rgba(15,30,46,0.06)] transition-all duration-200">
              <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${stat.tile}`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <p className="font-display text-2xl font-bold text-[#0f1e2e]">{stat.value}</p>
              <p className="text-sm text-[#5a6d80]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ca0b3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, title, or location..."
              className="w-full rounded-[14px] border border-[#dde5ec] bg-white py-3 pl-12 pr-4 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ca0b3]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="cursor-pointer appearance-none rounded-[14px] border border-[#dde5ec] bg-white py-3 pl-12 pr-8 text-[#0f1e2e] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1e2e]/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_24px_64px_-16px_rgba(15,30,46,0.45)]">
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-[#0f1e2e]">
                    {editingApp ? "Edit Application" : "Add New Application"}
                  </h2>
                  <button onClick={resetForm} aria-label="Close" className="rounded-[12px] border border-transparent p-2 text-[#5a6d80] transition-all duration-200 hover:border-[#dde5ec] hover:bg-[#f0f4f7] hover:text-[#0f1e2e]"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Company Name *</label>
                      <input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="Google" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Job Title *</label>
                      <input value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="Software Engineer" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Job Description</label>
                    <textarea value={formData.jobDescription} onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                      className="w-full resize-none rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" rows={4} placeholder="Paste job description..." />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Job URL</label>
                      <input value={formData.jobUrl} onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Location</label>
                      <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="San Francisco, CA" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#33475e]">Salary Range</label>
                      <input value={formData.salaryRange} onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" placeholder="$120k - $160k" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1">
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Contact Name</label>
                      <input value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Contact Email</label>
                      <input value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="w-full rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#0f1e2e]">Notes</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full resize-none rounded-[12px] border border-[#dde5ec] bg-white p-3 text-[#0f1e2e] placeholder:text-[#8ca0b3] transition-all duration-200 focus:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1" rows={2} />
                  </div>
                  <button onClick={handleSubmit}
                    className="w-full rounded-[14px] bg-[#0f766e] py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
                    {editingApp ? "Update Application" : "Add Application"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9efea] border-t-[#0f766e]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[24px] border border-[#dde5ec] bg-white py-20 text-center shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
            <Briefcase className="mx-auto mb-4 h-16 w-16 text-[#8ca0b3]" />
            <h3 className="mb-2 font-display text-xl font-bold text-[#0f1e2e]">
              {applications.length === 0 ? "No applications yet" : "No matches found"}
            </h3>
            <p className="mb-6 text-[#5a6d80]">
              {applications.length === 0 ? "Add your first job application to get started" : "Try adjusting your search or filter"}
            </p>
            {applications.length === 0 && (
              <button onClick={() => setShowAddForm(true)}
                className="rounded-[14px] bg-[#0f766e] px-6 py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57]">
                <Plus className="mr-2 inline h-5 w-5" /> Add First Application
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div key={app.id} className={`overflow-hidden rounded-[18px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_-12px_rgba(15,30,46,0.25)] ${app.completed ? 'opacity-60' : ''}`}>
                <div className={`p-6 ${app.completed ? 'line-through decoration-2 decoration-[#8ca0b3]' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <input type="checkbox" checked={!!app.completed} onChange={() => handleToggleComplete(app)}
                          className="h-5 w-5 shrink-0 cursor-pointer accent-[#0f766e]" />
                        <h3 className="truncate text-lg font-bold text-[#0f1e2e]">{app.jobTitle}</h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CONFIG[app.status].color}`}>
                          {STATUS_CONFIG[app.status].label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#5a6d80]">
                        <span className="flex items-center"><Building2 className="mr-1 h-4 w-4" />{app.companyName}</span>
                        {app.location && <span className="flex items-center"><MapPin className="mr-1 h-4 w-4" />{app.location}</span>}
                        {app.salaryRange && <span className="flex items-center"><DollarSign className="mr-1 h-4 w-4" />{app.salaryRange}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {app.matchScore > 0 && (
                        <span className={`rounded-full border px-3 py-1 text-sm font-bold ${app.matchScore >= 70 ? "border-[#15803d]/20 bg-[#dff5e3] text-[#15803d]" : app.matchScore >= 40 ? "border-[#027fb7]/20 bg-[#dcf1fd] text-[#027fb7]" : "border-[#9a5a0a]/20 bg-[#fff0d2] text-[#9a5a0a]"}`}>
                          {app.matchScore}%
                        </span>
                      )}
                      <button onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)} aria-label="Expand"
                        className="rounded-[12px] border border-transparent p-2 text-[#33475e] transition-all duration-200 hover:border-[#dde5ec] hover:bg-[#f0f4f7]">
                        {expandedApp === app.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedApp === app.id && (
                  <div className="space-y-4 border-t border-[#dde5ec] bg-[#f0f4f7]/40 px-6 pb-6 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((s) => (
                        <button key={s} onClick={() => handleStatusChange(app.id, s)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${app.status === s ? "border-[#0f766e] bg-[#0f766e] text-white" : "border-[#dde5ec] bg-white text-[#33475e] hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]"}`}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleMatchAnalysis(app)}
                        disabled={matchLoading === app.id}
                        className="rounded-[12px] bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] disabled:opacity-50">
                        {matchLoading === app.id ? "Analyzing..." : "AI Match Analysis"}
                      </button>
                      {app.jobUrl && (
                        <a href={app.jobUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center rounded-[12px] border border-[#dde5ec] bg-white px-4 py-2 text-sm font-semibold text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                          <ExternalLink className="mr-1 h-4 w-4" /> Open Listing
                        </a>
                      )}
                      <button onClick={() => { setEditingApp(app); setFormData({ companyName: app.companyName, jobTitle: app.jobTitle, jobDescription: app.jobDescription, jobUrl: app.jobUrl, location: app.location, salaryRange: app.salaryRange, status: app.status, notes: app.notes, contactEmail: app.contactEmail || "", contactName: app.contactName || "" }); setShowAddForm(true); }}
                        className="flex items-center rounded-[12px] border border-[#dde5ec] bg-white px-4 py-2 text-sm font-semibold text-[#0f1e2e] transition-all duration-200 hover:border-[#0f766e]/40 hover:bg-[#f0f4f7]">
                        <Edit3 className="mr-1 h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(app.id)}
                        className="flex items-center rounded-[12px] border border-[#d92d20]/20 bg-[#fde3e1] px-4 py-2 text-sm font-semibold text-[#d92d20] transition-all duration-200 hover:bg-[#fde3e1]/70">
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </button>
                    </div>

                    {app.jobDescription && (
                      <div className="rounded-[14px] border border-[#dde5ec] bg-white p-4">
                        <h4 className="mb-2 text-sm font-bold text-[#33475e]">Job Description</h4>
                        <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-[#5a6d80]">{app.jobDescription}</p>
                      </div>
                    )}

                    {app.keywords && app.keywords.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-bold text-[#33475e]">Key Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {app.keywords.map((kw, i) => (
                            <span key={i} className="rounded-full border border-[#2e4bff]/20 bg-[#e3e8ff] px-2 py-1 text-xs font-medium text-[#2e4bff]">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {app.notes && (
                      <div className="rounded-[14px] border border-[#9a5a0a]/20 bg-[#fff0d2] p-4">
                        <h4 className="mb-1 text-sm font-bold text-[#9a5a0a]">Notes</h4>
                        <p className="text-sm leading-relaxed text-[#33475e]">{app.notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-[#8ca0b3]">
                      Added {new Date(app.createdAt).toLocaleDateString()}
                      {app.lastUpdated && ` · Updated ${new Date(app.lastUpdated).toLocaleDateString()}`}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
