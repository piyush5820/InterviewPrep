"use client"
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ATSReport } from '@/types';
import toast from 'react-hot-toast';
import { Eye, Calendar, Building2, Target, FileText, X, TrendingUp, Clock, Star, BarChart3, Award, ChevronRight, Brain, Lightbulb, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [reports, setReports] = useState<ATSReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<ATSReport | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const q = query(collection(db, `users/${user.uid}/reports`));
                const querySnapshot = await getDocs(q);
                const fetchedReports: ATSReport[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedReports.push({ ...data, id: doc.id } as ATSReport);
                });

                setReports(fetchedReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
            } catch (error) {
                toast.error('Failed to load reports.');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [user]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-[#15803d]';
        if (score >= 60) return 'text-[#9a5a0a]';
        return 'text-[#d92d20]';
    };

    const getScoreBackground = (score: number) => {
        if (score >= 80) return 'bg-[#dff5e3] border-[#15803d]/20 text-[#15803d]';
        if (score >= 60) return 'bg-[#dcf1fd] border-[#027fb7]/20 text-[#027fb7]';
        return 'bg-[#fff0d2] border-[#9a5a0a]/20 text-[#9a5a0a]';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'bg-[#0f766e] text-white';
        if (score >= 60) return 'bg-[#2e4bff] text-white';
        return 'bg-[#ff6a3d] text-white';
    };

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f3f6f8] p-4">
                <div className="max-w-md rounded-[24px] border border-[#dde5ec] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#d9efea] text-[#0b5d57]">
                        <FileText className="h-8 w-8" />
                    </div>
                    <h2 className="mb-3 font-display text-2xl font-bold text-[#0f1e2e]">Welcome Back</h2>
                    <p className="leading-relaxed text-[#5a6d80]">Please sign in to access your ATS dashboard and view your resume analysis reports.</p>
                </div>
            </div>
        );
    }

    const avgScore = reports.length > 0 ? Math.round(reports.reduce((acc, r) => acc + r.matchScore, 0) / reports.length) : 0;

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
                    <span className="font-display text-[15px] font-bold text-[#0f1e2e]">ATS Dashboard</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f3f6f8]">
            {/* Header Section */}
            <div className="mx-4 mt-6 rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)] sm:mx-6">
                <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="mb-3 font-display text-4xl font-bold text-[#0f1e2e]">
                                Welcome back, {user.displayName?.split(' ')[0] || 'User'}
                            </h1>
                            <p className="text-lg text-[#5a6d80]">Here&apos;s your ATS performance overview</p>
                            <button
                                onClick={() => router.push('/ResumeScanner')}
                                className="mt-4 inline-flex items-center gap-2 rounded-[14px] bg-[#0f766e] px-6 py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
                            >
                                Go To Scan
                            </button>
                        </div>

                        {/* Stats Cards */}
                        <div className="flex flex-wrap gap-4 sm:gap-6">
                            <div className="min-w-[140px] flex-1 rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-6 sm:flex-none">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]">
                                        <BarChart3 className="h-6 w-6" />
                                    </span>
                                </div>
                                <p className="mb-1 font-display text-3xl font-bold text-[#0f1e2e]">{reports.length}</p>
                                <p className="text-sm text-[#5a6d80]">Total Scans</p>
                            </div>

                            <div className="min-w-[140px] flex-1 rounded-[18px] border border-[#dde5ec] bg-[#f0f4f7] p-6 sm:flex-none">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#dcf1fd] text-[#027fb7]">
                                        <Award className="h-6 w-6" />
                                    </span>
                                </div>
                                <p className="mb-1 font-display text-3xl font-bold text-[#0f1e2e]">{avgScore}%</p>
                                <p className="text-sm text-[#5a6d80]">Avg Score</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="flex items-center font-display text-xl font-bold text-[#0f1e2e] md:text-3xl">
                            <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0f766e] text-white">
                                <TrendingUp className="h-5 w-5" />
                            </span>
                            Recent Job Scans
                        </h2>
                        {reports.length > 0 && (
                            <div className="rounded-full border border-[#0f766e]/20 bg-[#d9efea] px-4 py-2">
                                <p className="text-sm font-bold text-[#063f3a]">
                                    {reports.length} scan{reports.length !== 1 ? 's' : ''} completed
                                </p>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-[#d9efea] border-t-[#0f766e]"></div>
                                <p className="text-lg text-[#5a6d80]">Loading your reports...</p>
                            </div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="mx-auto max-w-2xl rounded-[24px] border border-[#dde5ec] bg-white p-12 shadow-[0_1px_2px_rgba(15,30,46,0.06),0_12px_32px_-16px_rgba(15,30,46,0.25)]">
                                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[24px] bg-[#d9efea] text-[#0b5d57]">
                                    <FileText className="h-12 w-12" />
                                </div>
                                <h3 className="mb-4 font-display text-2xl font-bold text-[#0f1e2e]">Start Your ATS Journey</h3>
                                <p className="mb-8 text-lg leading-relaxed text-[#5a6d80]">
                                    Upload your resume and job descriptions to get detailed compatibility analysis and improvement suggestions.
                                </p>
                                <button onClick={() => router.push('/ResumeScanner')} className="rounded-[14px] bg-[#0f766e] px-8 py-4 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
                                    Scan Your First Resume
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="group cursor-pointer overflow-hidden rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[#0f766e]/40 hover:shadow-[0_16px_40px_-16px_rgba(15,30,46,0.3)]"
                                    onClick={() => setSelectedReport(report)}
                                >
                                    {/* Card Header */}
                                    <div className="p-6 pb-4">
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="mb-2 line-clamp-2 font-display text-xl font-bold text-[#0f1e2e]">
                                                    {report.jobTitle}
                                                </h3>
                                                <div className="mb-4 flex items-center text-[#5a6d80]">
                                                    <Building2 className="mr-2 h-4 w-4 shrink-0" />
                                                    <span className="truncate font-medium">{report.companyName}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 shrink-0 text-[#8ca0b3] transition-colors duration-200 group-hover:text-[#0f766e]" />
                                        </div>

                                        {/* Score Badge */}
                                        <div className={`mb-4 inline-flex items-center rounded-full border px-4 py-2 font-bold ${getScoreBackground(report.matchScore)}`}>
                                            <Target className="mr-2 h-4 w-4" />
                                            {report.matchScore}% Match
                                        </div>

                                        {/* Date */}
                                        <div className="mb-4 flex items-center text-sm text-[#8ca0b3]">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {new Date(report.createdAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="space-y-4 px-6 pb-6">
                                        <div>
                                            <h4 className="mb-3 flex items-center text-sm font-bold text-[#33475e]">
                                                <FileText className="mr-2 h-4 w-4 text-[#0f766e]" />
                                                Resume Preview
                                            </h4>
                                            <p className="line-clamp-3 rounded-[14px] border border-[#dde5ec] bg-[#f0f4f7] p-3 text-sm leading-relaxed text-[#5a6d80]">
                                                {report.resumeText}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="mb-3 flex items-center text-sm font-bold text-[#33475e]">
                                                <Star className="mr-2 h-4 w-4 text-[#9a5a0a]" />
                                                Key Suggestions
                                            </h4>
                                            <div className="space-y-2">
                                                {(report.contentSuggestions ?? []).slice(0, 2).map((suggestion, index) => (
                                                    <div key={index} className="flex items-start rounded-[14px] border border-[#027fb7]/15 bg-[#dcf1fd]/50 p-3">
                                                        <div className="mr-3 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#027fb7] text-xs font-bold text-white">
                                                            {index + 1}
                                                        </div>
                                                        <p className="line-clamp-2 text-sm leading-relaxed text-[#33475e]">
                                                            {suggestion}
                                                        </p>
                                                    </div>
                                                ))}
                                                {(report.contentSuggestions ?? []).length === 0 && (
                                                    <p className="rounded-[14px] border border-[#027fb7]/15 bg-[#dcf1fd]/50 p-3 text-sm text-[#5a6d80]">
                                                        No suggestions available.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="border-t border-[#dde5ec] bg-[#f0f4f7]/60 px-6 py-4">
                                        <div className="flex items-center justify-center text-sm font-semibold text-[#0f766e] transition-colors duration-200 group-hover:text-[#0b5d57]">
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Full Analysis
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Modal */}
            {
                selectedReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1e2e]/60 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[24px] border border-[#dde5ec] bg-white shadow-[0_24px_64px_-16px_rgba(15,30,46,0.45)]">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between gap-4 bg-[#0f1e2e] p-6">
                                <div className="min-w-0">
                                    <h2 className="mb-1 truncate font-display text-2xl text-white sm:text-3xl sm:font-bold">{selectedReport.jobTitle}</h2>
                                    <div className="flex items-center text-white/80">
                                        <Building2 className="mr-2 h-5 w-5 shrink-0" />
                                        <span className="truncate text-lg font-medium">{selectedReport.companyName}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    aria-label="Close"
                                    className="shrink-0 rounded-[12px] border border-white/20 bg-white/10 p-2 text-white transition-all duration-200 hover:bg-white/20"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
                                <div className="space-y-6 p-6 sm:p-8 sm:space-y-8">
                                    {/* Score and Date Header */}
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className={`inline-flex items-center rounded-[18px] border px-6 py-4 ${getScoreBackground(selectedReport.matchScore)}`}>
                                            <Target className="mr-3 h-6 w-6" />
                                            <span className="text-xl font-bold sm:text-2xl">
                                                {selectedReport.matchScore}% ATS Match Score
                                            </span>
                                        </div>
                                        <div className="flex items-center rounded-[14px] border border-[#dde5ec] bg-[#f0f4f7] px-4 py-3 text-[#33475e]">
                                            <Clock className="mr-2 h-5 w-5 shrink-0 text-[#0f766e]" />
                                            <span className="font-medium">
                                                Analyzed on {new Date(selectedReport.createdAt).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sub-Scores Grid */}
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                        {[
                                            { label: "Skills", score: selectedReport.skills?.score || 0, icon: Brain, tile: "bg-[#d9efea] text-[#0b5d57]" },
                                            { label: "Tone & Style", score: selectedReport.toneAndStyle?.score || 0, icon: Lightbulb, tile: "bg-[#fff0d2] text-[#9a5a0a]" },
                                            { label: "Content", score: selectedReport.content?.score || 0, icon: FileText, tile: "bg-[#dcf1fd] text-[#027fb7]" },
                                            { label: "Structure", score: selectedReport.structure?.score || 0, icon: Target, tile: "bg-[#e3e8ff] text-[#2e4bff]" },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-[18px] border border-[#dde5ec] bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
                                                <span className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-[12px] ${item.tile}`}>
                                                    <item.icon className="h-5 w-5" />
                                                </span>
                                                <p className="font-display text-2xl font-bold text-[#0f1e2e]">{item.score}%</p>
                                                <p className="mt-1 text-xs text-[#5a6d80]">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Hard Skills */}
                                    {selectedReport.hardSkillsMatch && selectedReport.hardSkillsMatch.length > 0 && (
                                        <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
                                            <h3 className="mb-4 flex items-center font-display text-xl font-bold text-[#0f1e2e]">
                                                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]">
                                                    <Brain className="h-4 w-4" />
                                                </span>
                                                Hard Skills Match
                                            </h3>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {selectedReport.hardSkillsMatch.map((skill, index) => (
                                                    <div key={index} className="flex items-center justify-between rounded-[12px] border border-[#dde5ec] bg-[#f0f4f7] p-3">
                                                        <span className="text-sm text-[#0f1e2e]">{skill.skill}</span>
                                                        {skill.present ? (
                                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803d]" />
                                                        ) : (
                                                            <X className="h-4 w-4 shrink-0 text-[#d92d20]" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Missing Keywords */}
                                    {selectedReport.missingKeywords && selectedReport.missingKeywords.length > 0 && (
                                        <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
                                            <h3 className="mb-4 flex items-center font-display text-xl font-bold text-[#0f1e2e]">
                                                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#fde3e1] text-[#d92d20]">
                                                    <AlertCircle className="h-4 w-4" />
                                                </span>
                                                Missing Keywords ({selectedReport.missingKeywords.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedReport.missingKeywords.map((kw, index) => {
                                                    const isObject = typeof kw === 'object' && kw !== null && 'keyword' in kw;
                                                    const keyword = isObject ? (kw as any).keyword : String(kw);
                                                    const severity = isObject ? (kw as any).severity : null;
                                                    const evidence = isObject ? (kw as any).evidence : null;
                                                    return (
                                                        <div key={index} className="rounded-[14px] border border-[#dde5ec] bg-white">
                                                            <div className="flex items-center justify-between gap-2 p-3">
                                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                                    <span className="rounded-full border border-[#d92d20]/20 bg-[#fde3e1] px-3 py-1 text-sm font-medium text-[#d92d20]">
                                                                        {keyword}
                                                                    </span>
                                                                    {severity && (
                                                                        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${
                                                                            severity === 'critical'
                                                                                ? 'border-[#d92d20]/20 bg-[#fde3e1] text-[#d92d20]'
                                                                                : 'border-[#9a5a0a]/20 bg-[#fff0d2] text-[#9a5a0a]'
                                                                        }`}>
                                                                            {severity === 'critical' ? 'CRITICAL' : 'NICE-TO-HAVE'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {evidence && (
                                                                    <button
                                                                        onClick={() => setExpandedEvidence(prev => ({ ...prev, [index]: !prev[index] }))}
                                                                        aria-label="Toggle evidence"
                                                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[#dde5ec] bg-[#f0f4f7] text-[#33475e] transition-all duration-200 hover:border-[#0f766e]/40 hover:text-[#0f766e]"
                                                                    >
                                                                        {expandedEvidence[index] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {evidence && expandedEvidence[index] && (
                                                                <div className="border-t border-[#dde5ec] px-3 pb-3">
                                                                    <p className="mt-2 text-xs leading-relaxed text-[#5a6d80]">{evidence}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Formatting Issues */}
                                    {selectedReport.formattingIssues && selectedReport.formattingIssues.length > 0 && (
                                        <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
                                            <h3 className="mb-4 flex items-center font-display text-xl font-bold text-[#0f1e2e]">
                                                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#fff0d2] text-[#9a5a0a]">
                                                    <AlertCircle className="h-4 w-4" />
                                                </span>
                                                Formatting Issues
                                            </h3>
                                            <ul className="space-y-2">
                                                {selectedReport.formattingIssues.map((issue, index) => (
                                                    <li key={index} className="flex items-start text-sm text-[#33475e]">
                                                        <div className="mr-3 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6a3d]"></div>
                                                        {issue}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Resume Content */}
                                    <div className="rounded-[24px] border border-[#dde5ec] bg-[#f0f4f7] p-6 sm:p-8">
                                        <h3 className="mb-6 flex items-center font-display text-xl font-bold text-[#0f1e2e]">
                                            <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]">
                                                <FileText className="h-4 w-4" />
                                            </span>
                                            Resume Content Analysis
                                        </h3>
                                        <div className="max-h-80 overflow-y-auto rounded-[18px] border border-[#dde5ec] bg-white p-6">
                                            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[#33475e]">
                                                {selectedReport.resumeText}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* Keyword Analysis */}
                                    {selectedReport.keywordAnalysis && (
                                        <div className="rounded-[24px] border border-[#2e4bff]/20 bg-[#e3e8ff]/40 p-6 sm:p-8">
                                            <h3 className="mb-6 flex items-center font-display text-xl font-bold text-[#0f1e2e]">
                                                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#e3e8ff] text-[#2e4bff]">
                                                    <BarChart3 className="h-4 w-4" />
                                                </span>
                                                Keyword Analysis
                                            </h3>
                                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                <div className="rounded-[18px] border border-[#dde5ec] bg-white p-4 text-center">
                                                    <p className="font-display text-2xl font-bold text-[#2e4bff]">{selectedReport.keywordAnalysis.overallMatch}%</p>
                                                    <p className="text-xs text-[#5a6d80]">Overall Match</p>
                                                </div>
                                                <div className="rounded-[18px] border border-[#dde5ec] bg-white p-4 text-center">
                                                    <p className="font-display text-2xl font-bold text-[#d92d20]">{selectedReport.keywordAnalysis.criticalMatch}%</p>
                                                    <p className="text-xs text-[#5a6d80]">Critical Keywords</p>
                                                </div>
                                                <div className="rounded-[18px] border border-[#dde5ec] bg-white p-4 text-center">
                                                    <p className="font-display text-2xl font-bold text-[#9a5a0a]">{selectedReport.keywordAnalysis.importantMatch}%</p>
                                                    <p className="text-xs text-[#5a6d80]">Important Keywords</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedReport.keywordAnalysis.keywords
                                                    .filter((k) => !k.present)
                                                    .slice(0, 15)
                                                    .map((kw, index) => (
                                                        <span key={index} className={`rounded-full border px-3 py-1 text-sm font-medium ${
                                                            kw.importance === "critical"
                                                                ? "border-[#d92d20]/20 bg-[#fde3e1] text-[#d92d20]"
                                                                : kw.importance === "important"
                                                                ? "border-[#9a5a0a]/20 bg-[#fff0d2] text-[#9a5a0a]"
                                                                : "border-[#dde5ec] bg-white text-[#5a6d80]"
                                                        }`}>
                                                            {kw.keyword}
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}

                                    {/* Improvement Suggestions */}
                                    <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06)] sm:p-8">
                                        <h3 className="mb-6 flex items-center font-display text-xl font-bold text-[#0f1e2e]">
                                            <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#fff0d2] text-[#9a5a0a]">
                                                <Star className="h-4 w-4" />
                                            </span>
                                            AI-Powered Improvement Suggestions
                                        </h3>
                                        <div className="grid gap-4">
                                            {(selectedReport.contentSuggestions ?? []).map((suggestion, index) => (
                                                <div key={index} className="flex items-start rounded-[18px] border border-[#dde5ec] bg-white p-5 shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
                                                    <div className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-[#0f766e] text-sm font-bold text-white">
                                                        {index + 1}
                                                    </div>
                                                    <p className="flex-1 leading-relaxed text-[#33475e]">{suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Skills Tips */}
                                    {selectedReport.skills?.tips && selectedReport.skills.tips.length > 0 && (
                                        <div className="rounded-[24px] border border-[#dde5ec] bg-white p-6 shadow-[0_1px_2px_rgba(15,30,46,0.06)] sm:p-8">
                                            <h3 className="mb-6 flex items-center font-display text-xl font-bold text-[#0f1e2e]">
                                                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#d9efea] text-[#0b5d57]">
                                                    <Brain className="h-4 w-4" />
                                                </span>
                                                Skills Improvement Tips
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedReport.skills.tips.map((tip, index) => (
                                                    <div key={index} className="flex items-start rounded-[14px] border border-[#dde5ec] bg-[#f0f4f7] p-4">
                                                        <div className={`mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tip.type === "good" ? "bg-[#dff5e3] text-[#15803d]" : "bg-[#fde3e1] text-[#d92d20]"}`}>
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${tip.type === "good" ? "text-[#15803d]" : "text-[#d92d20]"}`}>{tip.tip}</p>
                                                            {tip.explanation && <p className="mt-1 text-xs leading-relaxed text-[#5a6d80]">{tip.explanation}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-[#dde5ec] bg-[#f0f4f7]/60 p-6">
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="w-full rounded-[14px] bg-[#0f766e] py-4 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)] transition-all duration-200 hover:bg-[#0b5d57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2"
                                >
                                    Close Analysis Report
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
      </div>
    </div>
    );
}
