"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, getInterviewHistory, Interview } from "@/firebase/firebase";
import { useToast } from "@/components/ToastProvide";
import Sidebar from "@/components/Sidebar";
import {
    Home,
    FileText,
    Search,
    MessageCircle,
    History,
    Clock,
    Trophy,
    Calendar,
    User,
    ChevronRight,
    Menu,
    X,
    Star,
    Target,
    Zap
} from "lucide-react";
import ResultsSummary from "@/components/ResultsSummary";
import { Timestamp } from "firebase/firestore";

export default function HistoryPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [history, setHistory] = useState<Interview[]>([]);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log("History page user:", user ? `User ${user.uid} ` : "No user");

            if (!user) {
                showToast("❌ Please sign in to view history.", "error");
                router.push("/auth");
                setIsLoadingAuth(false);
                return;
            }

            try {
                const interviews = await getInterviewHistory(user.uid);
                console.log("Fetched interviews:", interviews);
                setHistory(interviews);
                if (interviews.length > 0 && !selectedInterview) {
                    setSelectedInterview(interviews[interviews.length - 1]);
                }
            } catch (error) {
                showToast("❌ Failed to load interview history.", "error");
                console.error("Error loading history:", error);
            } finally {
                setIsLoadingAuth(false);
            }
        });

        return () => unsubscribe();
    }, [router, showToast]);


    const getAvgScore = (scores: { [key: number]: number }, totalQuestions: number) => {
        const values = Array(totalQuestions)
            .fill(0)
            .map((_, index) => scores[index] || 0);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return "from-[#0f766e] to-[#0b5d57]";
        if (score >= 6) return "from-[#2e4bff] to-[#1e38d6]";
        return "from-[#ff6a3d] to-[#d9552b]";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 8) return "Excellent";
        if (score >= 6) return "Average";
        return "Poor";
    };

    const getScoreIcon = (score: number) => {
        if (score >= 8) return Trophy;
        if (score >= 6) return Star;
        return Target;
    };

    const formatDate = (createdAt: string | Timestamp) => {
        const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt.toDate();
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (createdAt: string | Timestamp) => {
        const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt.toDate();
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen bg-[#f3f6f8] flex items-center justify-center px-4">
                <div className="text-center bg-white border border-[#dde5ec] shadow-[0_8px_24px_rgba(15,30,46,0.09)] rounded-[24px] px-10 py-9 animate-rise">
                    <div className="relative w-16 h-16 mx-auto mb-4" role="status" aria-label="Loading history">
                        <div className="w-16 h-16 border-4 border-[#d9efea] border-t-[#0f766e] rounded-full animate-spin mx-auto"></div>
                        <Clock className="w-7 h-7 text-[#0f766e] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[#5a6d80] text-[15px] font-medium">Loading your history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-dvh overflow-hidden bg-[#e2e8ef] text-[#0f1e2e]">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            {/* Main Content — elevated sheet floating above the recessed sidebar */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative z-20 bg-white border border-[#dde5ec] shadow-[0_24px_64px_rgba(15,30,46,0.18),-16px_0_40px_rgba(15,30,46,0.10)] lg:rounded-[24px] lg:my-4 lg:mr-4 lg:ml-3">
                {/* Header */}
                <header className="shrink-0 bg-white/85 backdrop-blur-md border-b border-[#dde5ec] sticky top-0 z-20">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open sidebar"
                                className="md:hidden p-2 rounded-[10px] text-[#5a6d80] hover:text-[#0f1e2e] hover:bg-[#f0f4f7] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-[#0f1e2e] tracking-tight">Interview History</h1>
                                <p className="hidden md:block text-[#5a6d80] text-sm mt-0.5">Review your interview performance and track your progress</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex text-xs font-semibold text-[#0f766e] bg-[#d9efea] border border-[#0f766e]/15 rounded-full px-3 py-1.5">{history.length} session{history.length === 1 ? '' : 's'}</span>
                            <div className="w-9 h-9 bg-[#d9efea] border border-[#0f766e]/15 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-[#0f766e]" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content — own scroll region */}
                <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
                    {history.length === 0 ? (
                        <div className="text-center py-12 max-w-md mx-auto">
                            <div className="bg-white border border-[#dde5ec] shadow-[0_8px_24px_rgba(15,30,46,0.09)] rounded-[24px] px-8 py-10 animate-rise">
                                <div className="w-20 h-20 bg-[#d9efea] rounded-[18px] flex items-center justify-center mx-auto mb-6">
                                    <History className="w-10 h-10 text-[#0f766e]" />
                                </div>
                                <p className="font-display text-[#0f1e2e] text-xl font-bold">No interviews yet</p>
                                <p className="text-[#5a6d80] text-sm mt-2">Complete your first interview to see it here</p>
                                <button
                                    onClick={() => router.push("/homeform")}
                                    aria-label="Start your first interview"
                                    className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-[#0f766e] text-white text-sm font-semibold rounded-[14px] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:bg-[#0b5d57] active:bg-[#0b5d57] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus-visible:ring-offset-2"
                                >
                                    Start Interview
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {history.map((interview) => {
                                const avgScore = getAvgScore(interview.scores, interview.questions.length);
                                const scoreLabel = getScoreLabel(avgScore);
                                const scoreGradient = getScoreColor(avgScore);
                                const isSelected = selectedInterview?.id === interview.id;

                                return (
                                    <div
                                        key={interview.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={isSelected}
                                        aria-label={`View ${interview.interviewRole} interview from ${formatDate(interview.createdAt)}`}
                                        className={`group relative bg-white border rounded-[18px] overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50 ${isSelected
                                            ? 'border-[#0f766e] ring-2 ring-[#0f766e]/25 shadow-[0_8px_24px_rgba(15,30,46,0.09)]'
                                            : 'border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:shadow-[0_8px_24px_rgba(15,30,46,0.09)] hover:border-[#c6d2dd]'
                                            }`}
                                        onClick={() => setSelectedInterview(interview)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedInterview(interview); } }}
                                    >
                                        {/* Header */}
                                        <div className="relative bg-[#f0f4f7] p-4 border-b border-[#dde5ec] overflow-hidden">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-[#d9efea]/60 rounded-full -translate-y-10 translate-x-10" aria-hidden="true"></div>
                                            <div className="absolute bottom-0 left-0 w-12 h-12 bg-[#e3e8ff]/60 rounded-full translate-y-6 -translate-x-6" aria-hidden="true"></div>

                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-4 gap-2">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-display font-bold text-[16px] text-[#0f1e2e] leading-tight truncate">{interview.interviewRole}</h3>
                                                            <p className="text-[#5a6d80] text-[13px] font-medium mt-0.5">{interview.interviewType} Interview</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center shrink-0 w-7 h-7 rounded-[10px] bg-white border border-[#dde5ec] justify-center group-hover:border-[#0f766e]/40 group-hover:bg-[#d9efea]/50 transition-all duration-200">
                                                        <ChevronRight className="w-4 h-4 text-[#5a6d80] group-hover:text-[#0f766e] group-hover:translate-x-px transition-all duration-200" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 text-[#5a6d80]">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span className="text-[13px] font-medium">{formatDate(interview.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[#5a6d80]">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-[13px] font-medium">{formatTime(interview.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            {/* Score Display */}
                                            <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-[#f3f6f8] border border-[#dde5ec] rounded-[14px]">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[12px] bg-gradient-to-br ${scoreGradient} flex items-center justify-center shadow-[0_1px_2px_rgba(15,30,46,0.06)] shrink-0`}>
                                                        <span className="text-white font-bold text-xs md:text-[15px]">{avgScore.toFixed(1)}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[#33475e] text-[13px] font-semibold">Overall Score</div>
                                                        <div className={`text-[13px] font-bold ${avgScore >= 8 ? 'text-[#15803d]' :
                                                            avgScore >= 6 ? 'text-[#9a5a0a]' : 'text-[#d92d20]'
                                                            }`}>
                                                            {scoreLabel}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-[15px] md:text-lg font-bold text-[#0f1e2e] font-display">
                                                        {avgScore.toFixed(1)}
                                                    </div>
                                                    <div className="text-[11px] text-[#8ca0b3]">/ 10</div>
                                                </div>
                                            </div>

                                            {/* Skills Section */}
                                            {interview.skills && interview.skills.length > 0 && (
                                                <div>
                                                    <h4 className="text-[13px] font-semibold text-[#5a6d80] mb-2 flex items-center">
                                                        <Zap className="w-3.5 h-3.5 mr-1.5 text-[#0f766e]" />
                                                        Skills Assessed
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {interview.skills.split(',').slice(0, 3).map((skill, index) => (
                                                            <span key={index} className="px-2 py-1 bg-white border border-[#dde5ec] text-[#33475e] rounded-[10px] text-xs font-medium">
                                                                {skill.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Hover effect overlay */}
                                        <div className="absolute inset-0 bg-[#0f766e]/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-[18px]"></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Detailed Analysis Modal/Panel */}
            {selectedInterview && (
                <div className="fixed inset-0 bg-[#0f1e2e]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:hidden animate-fadeIn">
                    <div className="bg-white border border-[#dde5ec] shadow-[0_18px_48px_rgba(15,30,46,0.14)] rounded-[24px] max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-rise">
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0f1e2e]">Detailed Interview Analysis</h2>
                                <button
                                    onClick={() => setSelectedInterview(null)}
                                    aria-label="Close interview analysis"
                                    className="text-[#5a6d80] hover:text-[#0f1e2e] transition-all duration-200 p-2 hover:bg-[#f0f4f7] border border-[#dde5ec] rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="px-5 sm:px-6 pb-6 text-[#0f1e2e]">
                            <ResultsSummary
                                questions={selectedInterview.questions}
                                answers={selectedInterview.answers}
                                feedbacks={selectedInterview.feedbacks}
                                scores={selectedInterview.scores}
                                interviewrole={selectedInterview.interviewRole}
                                interviewtype={selectedInterview.interviewType}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Details Panel */}
            {selectedInterview && !isMobile && (
                <div className="hidden md:block fixed right-0 top-0 h-full w-1/2 bg-white border-l border-[#dde5ec] shadow-[0_18px_48px_rgba(15,30,46,0.14)] overflow-y-auto z-40 animate-fadeIn">
                    <div className="flex flex-col min-h-full">
                        <div className="flex items-center justify-between gap-3 p-6 border-b border-[#dde5ec] bg-white/90 backdrop-blur sticky top-0 z-10">
                            <h2 className="font-display text-xl font-bold text-[#0f1e2e]">Detailed Interview Analysis</h2>
                            <button
                                onClick={() => setSelectedInterview(null)}
                                aria-label="Close interview analysis panel"
                                className="text-[#5a6d80] hover:text-[#0f1e2e] transition-all duration-200 p-2 hover:bg-[#f0f4f7] border border-[#dde5ec] rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 text-[#0f1e2e]">
                            <ResultsSummary
                                questions={selectedInterview.questions}
                                answers={selectedInterview.answers}
                                feedbacks={selectedInterview.feedbacks}
                                scores={selectedInterview.scores}
                                interviewrole={selectedInterview.interviewRole}
                                interviewtype={selectedInterview.interviewType}
                            />
                        </div>
                    </div>

                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#0f1e2e]/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
