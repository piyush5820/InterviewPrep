"use client";
import { useEffect, useState } from "react";
import ResultsSummary from "@/components/ResultsSummary";
import { auth, getInterviewHistory, Interview } from "@/firebase/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvide";
import { ArrowLeft, Trophy, Target, Award, Download, RotateCcw, CheckCircle, Briefcase, TrendingUp, TrendingDown, Clock, Mic, MessagesSquare, Languages } from "lucide-react";
import { Timestamp } from "firebase/firestore";

export default function ResultsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [results, setResults] = useState<Interview>({
        id: "",
        userId: "",
        questions: [],
        answers: {},
        feedbacks: {},
        scores: {},
        interviewType: "",
        interviewRole: "",
        skills: "",
        createdAt: "",
    });
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingResults, setIsLoadingResults] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            const user = auth.currentUser;
            console.log("Results page user:", user ? `User ${user.uid}` : "No user");
            if (!user) {
                showToast("❌ Please sign in to view results.", "error");
                router.push("/auth");
                setIsLoadingAuth(false);
                setIsLoadingResults(false);
                return;
            }

            try {
                const history = await getInterviewHistory(user.uid);
                console.log("Fetched history:", history);
                if (history.length > 0) {
                    const latestInterview = history.sort((a, b) => {
                        const dateA = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : a.createdAt.toDate().getTime();
                        const dateB = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : b.createdAt.toDate().getTime();
                        return dateB - dateA;
                    })[0];
                    console.log("Latest interview:", latestInterview);
                    setResults(latestInterview);
                } else {
                    showToast("⚠️ No interview results found.", "warning");
                }
            } catch (error) {
                showToast("❌ Failed to load results.", "error");
                console.error("Error loading results:", error);
            } finally {
                setIsLoadingAuth(false);
                setIsLoadingResults(false);
            }
        };

        fetchResults();
    }, [router, showToast]);

    const avgScore =
        results.questions.length > 0
            ? Object.values(results.scores).reduce((a, b) => a + b, 0) / results.questions.length
            : 0;

    const getScoreColor = (score: number) => {
        if (score >= 8) return "text-[#0f766e]";
        if (score >= 6) return "text-[#2e4bff]";
        return "text-[#d9552b]";
    };

    const getPerformanceLevel = (score: number) => {
        if (score >= 8)
            return { level: "Excellent", icon: <Trophy className="w-5 h-5" />, color: "text-[#0f766e]" };
        if (score >= 6)
            return { level: "Good", icon: <Target className="w-5 h-5" />, color: "text-[#2e4bff]" };
        return { level: "Needs Improvement", icon: <TrendingDown className="w-5 h-5" />, color: "text-[#d9552b]" };
    };

    const performance = getPerformanceLevel(avgScore);

    const formatDate = (createdAt: string | Timestamp) => {
        const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt.toDate();
        return date.toLocaleString();
    };

    const handleRetakeInterview = async () => {
        try {
            localStorage.removeItem("questions");
            localStorage.removeItem("userAnswers");
            localStorage.removeItem("feedbacks");
            localStorage.removeItem("scores");
            localStorage.removeItem("currentQuestionIndex");
            localStorage.removeItem("interviewRole");
            localStorage.removeItem("interviewType")
            localStorage.removeItem('skills')
            router.push("/homeform");
        } catch (error) {
            showToast("❌ Failed to clear results.", "error");
            console.error("Error clearing results:", error);
        }
    };

    const handleDownloadResults = () => {
        try {
            const summary = `Interview Results Summary
Date: ${formatDate(results.createdAt)}
Average Score: ${avgScore.toFixed(1)}/10
Performance Level: ${performance.level}
${results.summary
                ? `Delivery — Confidence: ${results.summary.confidence.toFixed(1)}/10, Communication: ${results.summary.communication.toFixed(1)}/10, Language: ${results.summary.language.toFixed(1)}/10, Overall: ${results.summary.overall.toFixed(1)}/10
Delivery Notes: ${results.summary.text}
`
                : ""}Questions and Answers:
${results.questions
                    .map((q, i) => {
                        return `
Question ${i + 1}: ${q}
Your Answer: ${results.answers[i] || "No answer recorded"}
Score: ${results.scores[i] || 0}/10
Feedback: ${results.feedbacks[i] || "No feedback available"}
`;
                    })
                    .join("\n")}`;

            const blob = new Blob([summary], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `interview-results-${formatDate(results.createdAt).split(",")[0].replace(/\//g, "-")}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            showToast("❌ Failed to download results.", "error");
            console.error("Error downloading results:", error);
        }
    };

    if (isLoadingAuth || isLoadingResults) {
        return (
            <div className="min-h-screen bg-[#f3f6f8] flex items-center justify-center px-4">
                <div className="bg-white border border-[#dde5ec] shadow-[0_8px_24px_rgba(15,30,46,0.09)] rounded-[24px] p-8 max-w-md w-full text-center relative animate-rise">
                    <div className="relative w-16 h-16 mx-auto mb-6" role="status" aria-label="Loading results">
                        <div className="absolute inset-0 border-4 border-[#d9efea] border-t-[#0f766e] rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-[#e3e8ff] border-t-[#2e4bff] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}></div>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#0f1e2e] mb-2">Loading Results...</h2>
                    <p className="text-[#5a6d80] text-sm">Fetching your interview performance</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f6f8] text-[#0f1e2e] relative overflow-hidden">
            <div className="ambient-orb w-[420px] h-[420px] -top-40 -left-40 opacity-50" style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.14), transparent 70%)' }} aria-hidden="true" />
            <div className="ambient-orb w-[380px] h-[380px] top-24 -right-32 opacity-40" style={{ background: 'radial-gradient(circle, rgba(46,75,255,0.12), transparent 70%)', animationDelay: '-6s' }} aria-hidden="true" />

            {/* Header */}
            <div className="bg-white/85 backdrop-blur-md border-b border-[#dde5ec] sticky top-0 z-10 relative">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button
                            onClick={() => router.push("/history")}
                            className="p-2.5 sm:p-3 hover:bg-[#f0f4f7] border border-transparent hover:border-[#dde5ec] rounded-[10px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-[#0f1e2e]" />
                        </button>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#d9efea] rounded-[14px] flex items-center justify-center shrink-0">
                                <Award className="w-6 h-6 text-[#0f766e]" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-display text-lg sm:text-xl font-bold text-[#0f1e2e] tracking-tight truncate">Interview Results</h1>
                                <p className="text-[13px] text-[#5a6d80]">Your Performance Summary</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadResults}
                            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#dde5ec] text-[#0f1e2e] text-sm font-semibold rounded-[14px] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:border-[#0f766e]/40 hover:bg-[#f0f4f7] active:bg-[#e6edf2] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                            aria-label="Download results"
                        >
                            <Download className="w-4 h-4 text-[#5a6d80]" />
                            <span>Download</span>
                        </button>
                        <button
                            onClick={handleRetakeInterview}
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#0f766e] text-white text-sm font-semibold rounded-[14px] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:bg-[#0b5d57] active:bg-[#0b5d57] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus-visible:ring-offset-2"
                            aria-label="Retake interview"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden xs:inline sm:inline">Retake</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
                {/* Stats Cards */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Overall Score Card */}
                    <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:shadow-[0_8px_24px_rgba(15,30,46,0.09)] rounded-[18px] p-6 sm:p-8 transition-all duration-200">
                        <div className="text-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#d9efea] rounded-[18px] flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#0f766e]" />
                            </div>
                            <h3 className="font-display text-[15px] font-semibold text-[#0f1e2e] mb-2">Overall Score</h3>
                            <div className={`font-display text-4xl font-bold ${getScoreColor(avgScore)} mb-1`}>
                                {avgScore.toFixed(1)}
                            </div>
                            <div className="text-[13px] text-[#8ca0b3]">out of 10</div>
                        </div>
                    </div>

                    {/* Performance Level Card */}
                    <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:shadow-[0_8px_24px_rgba(15,30,46,0.09)] rounded-[18px] p-6 sm:p-8 transition-all duration-200">
                        <div className="text-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#e3e8ff] rounded-[18px] flex items-center justify-center mx-auto mb-4">
                                <div className="text-[#2e4bff]">
                                    {performance.icon}
                                </div>
                            </div>
                            <h3 className="font-display text-[15px] font-semibold text-[#0f1e2e] mb-2">Performance</h3>
                            <div className={`font-display text-xl font-bold ${getScoreColor(avgScore)}`}>
                                {performance.level}
                            </div>
                            <div className="text-[13px] text-[#8ca0b3] mt-1">based on average</div>
                        </div>
                    </div>

                    {/* Questions Completed Card */}
                    <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:shadow-[0_8px_24px_rgba(15,30,46,0.09)] rounded-[18px] p-6 sm:p-8 transition-all duration-200 sm:col-span-2 md:col-span-1">
                        <div className="text-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#ffe8dd] rounded-[18px] flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#d9552b]" />
                            </div>
                            <h3 className="font-display text-[15px] font-semibold text-[#0f1e2e] mb-2">Completed</h3>
                            <div className="font-display text-4xl font-bold text-[#0f1e2e] mb-1">
                                {results.questions.length}
                            </div>
                            <div className="text-[13px] text-[#8ca0b3]">questions</div>
                        </div>
                    </div>
                </div>

                {/* Delivery Summary (live voice interviews) */}
                {results.summary && (
                    <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] rounded-[24px] p-5 sm:p-8 mb-6 sm:mb-8">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0f1e2e] flex items-center">
                                <div className="w-9 h-9 bg-[#d9efea] rounded-[10px] flex items-center justify-center mr-3 shrink-0">
                                    <Mic className="w-5 h-5 text-[#0f766e]" />
                                </div>
                                Delivery Summary
                            </h2>
                            <span className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-full bg-[#d9efea] text-[#0b5d57]">
                                Overall {results.summary.overall.toFixed(1)}/10
                            </span>
                        </div>
                        <p className="text-[14px] leading-relaxed text-[#33475e] mb-5">{results.summary.text}</p>
                        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                            {[
                                { label: "Confidence", value: results.summary.confidence, icon: <Mic className="w-4 h-4 text-[#0f766e]" />, bar: "bg-[#0f766e]" },
                                { label: "Communication", value: results.summary.communication, icon: <MessagesSquare className="w-4 h-4 text-[#2e4bff]" />, bar: "bg-[#2e4bff]" },
                                { label: "Language", value: results.summary.language, icon: <Languages className="w-4 h-4 text-[#d9552b]" />, bar: "bg-[#ff6a3d]" },
                            ].map((metric) => (
                                <div key={metric.label} className="bg-[#f3f6f8] rounded-[14px] p-4 border border-[#dde5ec]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5a6d80]">
                                            {metric.icon}
                                            {metric.label}
                                        </span>
                                        <span className="text-[14px] font-bold text-[#0f1e2e]">{metric.value.toFixed(1)}/10</span>
                                    </div>
                                    <div className="h-2 bg-white rounded-full overflow-hidden border border-[#dde5ec]">
                                        <div className={`h-full ${metric.bar} rounded-full`} style={{ width: `${Math.min(Math.max(metric.value, 0), 10) * 10}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Interview Details */}
                <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] rounded-[24px] p-5 sm:p-8 mb-6 sm:mb-8">
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <div className="bg-[#f3f6f8] rounded-[14px] p-5 border border-[#dde5ec]">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <span className="w-8 h-8 rounded-[10px] bg-white border border-[#dde5ec] flex items-center justify-center">
                                    <Briefcase className="w-4 h-4 text-[#0f766e]" />
                                </span>
                                <span className="text-[13px] font-semibold text-[#5a6d80]">Interview Type</span>
                            </div>
                            <p className="text-[#0f1e2e] font-semibold font-display">{results.interviewType}</p>
                        </div>
                        <div className="bg-[#f3f6f8] rounded-[14px] p-5 border border-[#dde5ec]">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <span className="w-8 h-8 rounded-[10px] bg-white border border-[#dde5ec] flex items-center justify-center">
                                    <Target className="w-4 h-4 text-[#2e4bff]" />
                                </span>
                                <span className="text-[13px] font-semibold text-[#5a6d80]">Role</span>
                            </div>
                            <p className="text-[#0f1e2e] font-semibold font-display">{results.interviewRole}</p>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="bg-[#f3f6f8] rounded-[14px] p-5 border border-[#dde5ec] mb-6 sm:mb-8">
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <span className="w-8 h-8 rounded-[10px] bg-white border border-[#dde5ec] flex items-center justify-center">
                                <Clock className="w-4 h-4 text-[#027fb7]" />
                            </span>
                            <span className="text-[13px] font-semibold text-[#5a6d80]">Interview Date</span>
                        </div>
                        <p className="text-[#0f1e2e] font-semibold">{formatDate(results.createdAt)}</p>
                    </div>

                    {/* Detailed Feedback Section */}
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0f1e2e] mb-5 sm:mb-6 flex items-center">
                        <div className="w-9 h-9 bg-[#d9efea] rounded-[10px] flex items-center justify-center mr-3 shrink-0">
                            <TrendingUp className="w-5 h-5 text-[#0f766e]" />
                        </div>
                        Detailed Feedback
                    </h2>
                    <div className="bg-[#f3f6f8] rounded-[18px] p-4 sm:p-6 border border-[#dde5ec]">
                        <ResultsSummary
                            questions={results.questions}
                            answers={results.answers}
                            feedbacks={results.feedbacks}
                            scores={results.scores}
                            interviewtype={results.interviewType}
                            interviewrole={results.interviewRole}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button
                        onClick={handleRetakeInterview}
                        aria-label="Take another interview"
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0f766e] text-white font-semibold rounded-[14px] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:bg-[#0b5d57] active:bg-[#0b5d57] hover:-translate-y-px transform transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus-visible:ring-offset-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Take Another Interview</span>
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem("questions");
                            localStorage.removeItem("userAnswers");
                            localStorage.removeItem("feedbacks");
                            localStorage.removeItem("scores");
                            localStorage.removeItem("currentQuestionIndex");
                            localStorage.removeItem("interviewRole");
                            localStorage.removeItem("interviewType")
                            localStorage.removeItem('skills')
                            router.push("/history");
                        }}
                        aria-label="View interview history"
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-[#dde5ec] text-[#0f1e2e] font-semibold rounded-[14px] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:border-[#0f766e]/40 hover:bg-[#f0f4f7] active:bg-[#e6edf2] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>View History</span>
                    </button>
                </div>
            </main>

            <style jsx>{`
                .animate-reverse {
                    animation-direction: reverse;
                }
            `}</style>
        </div>
    );
}
