"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, User, Sparkles, ArrowRight, Brain, Zap, Shield, Code, Database, Palette, MessageCircle, TrendingUp, Globe, Smartphone, Server, Camera, Star, Target, ListChecks, Languages, Tag, CheckCircle, Users, Award, Upload, FileText, X, ClipboardList } from "lucide-react";
import Image from "next/image";
import logo from "@/public/logo.png"
import { getAuth } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import toast from "react-hot-toast";
import { normalizeQuestions } from "@/lib/questions";

export default function HomeForm() {
    const router = useRouter();
    const [jobProfile, setJobProfile] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("Fresher");
    const [skills, setSkills] = useState("");
    const [interviewType, setInterviewType] = useState("Technical");
    const [language, setLanguage] = useState("English");
    const [targetCompany, setTargetCompany] = useState("");
    const [focusTopics, setFocusTopics] = useState("");
    const [loading, setLoading] = useState(false);

    // Tab mode: "form" | "resume"
    const [mode, setMode] = useState<"form" | "resume">("form");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const unlimitedEmails = ["saurabhgk7@gmail.com"];

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setLoading(true);
        try {
            const auth = getAuth();
            const db = getFirestore();
            const user = auth.currentUser;

            if (!user || !user.email) {
                alert("Please sign in to continue.");
                setLoading(false);
                return;
            }

            const userId = user.uid;
            const email = user.email;
            const isUnlimited = unlimitedEmails.includes(email);

            // Check current interview count
            if (!isUnlimited) {
                const interviewsRef = collection(db, "users", userId, "interviews");
                const snapshot = await getDocs(interviewsRef);
                const count = snapshot.size;

                if (count >= 3) {
                    toast.error("Limit reached: Upgrade tier to access unlimited interviews");
                    setLoading(false);
                    router.push("/dashboard");
                    return;
                }

                toast(`You've used ${count} out of 3 free interviews`, {
                    icon: "💡",
                    duration: 3000,
                });
            }

            const res = await fetch("/api/generateQuestions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobProfile,
                    experienceLevel,
                    skills,
                    interviewType,
                    language,
                    targetCompany,
                    focusTopics
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to generate questions from server.");
            }

            const data = await res.json();

            if (!data.questions || data.questions.length === 0) {
                throw new Error("No questions were returned. Please try again.");
            }

            const normalized = Array.isArray(data.questions) ? normalizeQuestions(data.questions) : [];
            localStorage.setItem("questions", JSON.stringify(normalized));
            localStorage.setItem("currentQuestionIndex", "0");
            localStorage.setItem("interviewType", interviewType);
            localStorage.setItem("interviewRole", jobProfile);
            localStorage.setItem("skills", skills)
            localStorage.removeItem("resumeText");
            router.push("/interview");
        } catch (error) {
            console.error("Failed to generate questions.", error);
            toast.error(error instanceof Error ? error.message : "Failed to generate questions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Resume upload handlers ──
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setIsDragging(false), []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.toLowerCase().endsWith(".pdf")) {
            setResumeFile(file);
        } else {
            toast.error("Please upload a PDF file.");
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.toLowerCase().endsWith(".pdf")) {
            setResumeFile(file);
        } else {
            toast.error("Please upload a PDF file.");
        }
    };

    const handleResumeSubmit = async () => {
        if (!resumeFile) {
            toast.error("Please upload your resume PDF first.");
            return;
        }
        setLoading(true);
        try {
            const auth = getAuth();
            const db = getFirestore();
            const user = auth.currentUser;

            if (!user || !user.email) {
                toast.error("Please sign in to continue.");
                setLoading(false);
                return;
            }

            const isUnlimited = unlimitedEmails.includes(user.email);
            if (!isUnlimited) {
                const interviewsRef = collection(db, "users", user.uid, "interviews");
                const snapshot = await getDocs(interviewsRef);
                if (snapshot.size >= 3) {
                    toast.error("Limit reached: Upgrade tier to access unlimited interviews");
                    setLoading(false);
                    router.push("/dashboard");
                    return;
                }
                toast(`You've used ${snapshot.size} out of 3 free interviews`, { icon: "💡", duration: 3000 });
            }

            const formData = new FormData();
            formData.append("resume", resumeFile);

            const res = await fetch("/api/resume-to-questions", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to process resume.");
            }

            const data = await res.json();

            if (!data.questions || data.questions.length === 0) {
                throw new Error("No questions were generated from your resume.");
            }

            const normalized = Array.isArray(data.questions) ? normalizeQuestions(data.questions) : [];
            const inferredRole = typeof data.interviewRole === "string" && data.interviewRole.trim()
                ? data.interviewRole.trim()
                : "Technical Interview";

            localStorage.setItem("questions", JSON.stringify(normalized));
            localStorage.setItem("currentQuestionIndex", "0");
            localStorage.setItem("interviewType", "Technical");
            localStorage.setItem("interviewRole", inferredRole);
            localStorage.setItem("skills", "");
            localStorage.setItem("resumeText", data.resumeText || "");

            toast.success("Questions generated from your resume! Starting interview...");
            router.push("/interview");
        } catch (error) {
            console.error("Resume submission failed.", error);
            toast.error(error instanceof Error ? error.message : "Failed to process resume. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const jobCategories = [
        { icon: Code, title: "Development", roles: ["Frontend", "Backend", "Full Stack", "Mobile"] },
        { icon: Database, title: "Data Science", roles: ["Data Analyst", "ML Engineer", "Data Engineer"] },
        { icon: Palette, title: "Software Dev.", roles: ["System engg.", "Developer", "Product Design"] },
        { icon: MessageCircle, title: "Marketing", roles: ["Digital Marketing", "Content", "SEO"] },
        { icon: TrendingUp, title: "Business", roles: ["Product Manager", "Business Analyst", "Consultant"] },
        { icon: Shield, title: "Security", roles: ["DevOps", "Cloud Engineer", "Cybersecurity"] }
    ];

    const floatingElements = [
        { icon: Brain, delay: "0s", duration: "6s", position: { left: "15%", top: "20%" } },
        { icon: Zap, delay: "1s", duration: "8s", position: { left: "85%", top: "15%" } },
        { icon: Globe, delay: "2s", duration: "7s", position: { left: "75%", top: "70%" } },
        { icon: Smartphone, delay: "3s", duration: "9s", position: { left: "20%", top: "80%" } },
        { icon: Server, delay: "4s", duration: "6s", position: { left: "90%", top: "45%" } },
        { icon: Camera, delay: "5s", duration: "8s", position: { left: "10%", top: "50%" } }
    ];

    const features = [
        { icon: CheckCircle, text: "Personalized Questions" },
        { icon: Users, text: "Real Interview Scenarios" },
        { icon: Award, text: "Industry Standards" }
    ];

    const inputClass = "w-full px-4 py-3.5 bg-[#f7fafb] border border-[#dde5ec] rounded-[10px] text-[#0f1e2e] placeholder:text-[#8ca0b3] focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:ring-offset-0 focus:border-[#0f766e] transition-all duration-200";
    const labelClass = "flex items-center text-sm font-semibold text-[#0f1e2e] mb-2";

    return (
        <div className="min-h-screen bg-[#f3f6f8] text-[#0f1e2e]">
            <div className="flex items-center justify-center min-h-screen p-4 lg:p-8">
                <div className="w-full max-w-7xl grid lg:grid-cols-5 gap-8 lg:gap-8 items-stretch">

                    {/* Left Side - Form card */}
                    <div className="lg:col-span-3 relative">
                        <div className="bg-white border border-[#dde5ec] rounded-[24px] shadow-[0_12px_32px_rgba(15,30,46,0.08)] p-6 lg:p-10 transition-shadow duration-200">

                            {/* Form Header */}
                            <div className="text-center mb-6">
                                <Image src={logo} alt="PreplystHub - AI Logo" className="w-12 h-12 md:h-14 md:w-14 inline-flex items-center rounded-[14px] justify-center" />
                                <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#0f1e2e] mb-3 mt-3 tracking-tight" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>
                                    Start Your
                                    <span className="text-[#0f766e]"> Practice</span>
                                </h2>
                                <p className="text-[#5a6d80] text-lg">Generate personalized interview questions tailored for you</p>

                                {/* Feature Pills */}
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2 bg-[#d9efea] text-[#0b5d57] px-3 py-1.5 rounded-full text-sm border border-[#dde5ec]">
                                            <feature.icon className="w-3.5 h-3.5" aria-hidden="true" />
                                            <span>{feature.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Mode Tab Switcher ── */}
                            <div className="flex items-center bg-[#f0f4f7] border border-[#dde5ec] rounded-[14px] p-1 mb-6" role="tablist" aria-label="Setup mode">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === "form"}
                                    onClick={() => setMode("form")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${mode === "form" ? "bg-[#0f1e2e] text-white shadow-[0_4px_12px_rgba(15,30,46,0.18)]" : "text-[#5a6d80] hover:bg-white hover:text-[#0f1e2e]"}`}
                                >
                                    <ClipboardList className="w-4 h-4" aria-hidden="true" />
                                    Fill Form
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === "resume"}
                                    onClick={() => setMode("resume")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${mode === "resume" ? "bg-[#0f1e2e] text-white shadow-[0_4px_12px_rgba(15,30,46,0.18)]" : "text-[#5a6d80] hover:bg-white hover:text-[#0f1e2e]"}`}
                                >
                                    <FileText className="w-4 h-4" aria-hidden="true" />
                                    Upload Resume
                                </button>
                            </div>

                            {/* ── Resume Upload Panel ── */}
                            {mode === "resume" && (
                                <div className="space-y-5">
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Upload resume PDF"
                                        className={`relative flex flex-col items-center justify-center w-full min-h-[220px] border-2 border-dashed rounded-[18px] cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${isDragging ? "bg-[#d9efea] border-[#0f766e] scale-[1.01]" : resumeFile ? "bg-white border-[#8ca0b3]" : "bg-[#f7fafb] border-[#8ca0b3] hover:bg-[#f0f4f7] hover:border-[#0f766e]"}`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />

                                        {resumeFile ? (
                                            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
                                                <div className="w-16 h-16 bg-[#d9efea] border border-[#dde5ec] rounded-[14px] flex items-center justify-center">
                                                    <FileText className="w-8 h-8 text-[#0f766e]" aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <p className="text-[#0f1e2e] font-semibold text-sm">{resumeFile.name}</p>
                                                    <p className="text-[#8ca0b3] text-xs mt-1">{(resumeFile.size / 1024).toFixed(1)} KB · PDF</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                                                    className="flex items-center gap-1 text-xs font-medium text-[#d92d20] bg-[#fde3e1] hover:bg-[#fde3e1]/80 px-3 py-1.5 rounded-full border border-[#dde5ec] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d92d20]"
                                                >
                                                    <X className="w-3 h-3" aria-hidden="true" /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
                                                <div className={`w-16 h-16 rounded-[14px] border border-[#dde5ec] flex items-center justify-center transition-all duration-200 ${isDragging ? "bg-[#0f766e]" : "bg-[#d9efea]"}`}>
                                                    <Upload className={`w-8 h-8 transition-colors duration-200 ${isDragging ? "text-white" : "text-[#0f766e]"}`} aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <p className="text-[#0f1e2e] font-semibold text-sm">Drop your resume here</p>
                                                    <p className="text-[#5a6d80] text-xs mt-1">or <span className="text-[#0f766e] underline font-semibold">click to browse</span></p>
                                                </div>
                                                <p className="text-[#8ca0b3] text-xs">PDF only · Max 5MB</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info banner */}
                                    <div className="flex items-start gap-3 bg-[#dcf1fd] border border-[#dde5ec] rounded-[14px] p-4">
                                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#027fb7]" aria-hidden="true" />
                                        <p className="text-xs text-[#0f1e2e] leading-relaxed">
                                            We&apos;ll extract your resume content using our document parser and generate <strong>5 tailored interview questions</strong> grounded in your actual projects, skills, and experience.
                                        </p>
                                    </div>

                                    {/* Start Interview Button */}
                                    <button
                                        type="button"
                                        onClick={handleResumeSubmit}
                                        disabled={loading || !resumeFile}
                                        className={`w-full py-4 rounded-[14px] bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] text-white font-semibold shadow-[0_8px_20px_rgba(217,85,43,0.28)] hover:shadow-[0_10px_24px_rgba(217,85,43,0.34)] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_8px_20px_rgba(217,85,43,0.28)] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${(loading || !resumeFile) ? "opacity-60 cursor-not-allowed" : ""}`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                                <span className="text-lg">Analyzing Resume...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" aria-hidden="true" />
                                                <span className="text-lg">Start Interview from Resume</span>
                                                <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* ── Standard Form ── */}
                            {mode === "form" && (
                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                    {/* Job Profile */}
                                    <div className="lg:col-span-2 space-y-1">
                                        <label className={labelClass}>
                                            <Briefcase className="w-4 h-4 mr-2 text-[#0f766e]" aria-hidden="true" />
                                            Job Profile
                                        </label>
                                        <input
                                            type="text"
                                            value={jobProfile}
                                            onChange={(e) => setJobProfile(e.target.value)}
                                            placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                                            required
                                            className={inputClass}
                                        />
                                    </div>

                                    {/* Experience Level */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            <User className="w-4 h-4 mr-2 text-[#0f766e]" aria-hidden="true" />
                                            Experience Level
                                        </label>
                                        <select
                                            value={experienceLevel}
                                            onChange={(e) => setExperienceLevel(e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="Fresher">Fresher (0-1 years)</option>
                                            <option value="Junior">Junior (1-3 years)</option>
                                            <option value="Mid">Mid-level (3-6 years)</option>
                                            <option value="Senior">Senior (6+ years)</option>
                                        </select>
                                    </div>

                                    {/* Interview Type */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            <ListChecks className="w-4 h-4 mr-2 text-[#0f766e]" aria-hidden="true" />
                                            Interview Type
                                        </label>
                                        <select
                                            value={interviewType}
                                            onChange={(e) => setInterviewType(e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="Technical">Technical</option>
                                            <option value="HR">HR / Behavioral</option>
                                            <option value="Managerial">Managerial</option>
                                            <option value="Mixed">Mixed</option>
                                        </select>
                                    </div>

                                    {/* Skills */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            <Tag className="w-4 h-4 mr-2 text-[#0f766e]" aria-hidden="true" />
                                            Key Skills
                                        </label>
                                        <input
                                            type="text"
                                            value={skills}
                                            onChange={(e) => setSkills(e.target.value)}
                                            placeholder="e.g., React, SQL, Python, Leadership"
                                            className={inputClass}
                                        />
                                    </div>

                                    {/* Language */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            <Languages className="w-4 h-4 mr-2 text-[#0f766e]" aria-hidden="true" />
                                            Language
                                        </label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="English">English</option>
                                            <option value="Hindi">Hindi</option>
                                            <option value="Bilingual">Bilingual</option>
                                        </select>
                                    </div>

                                    {/* Target Company */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            <Target className="w-4 h-4 mr-2 text-[#0f766e]" aria-hidden="true" />
                                            Target Company
                                            <span className="ml-2 text-xs text-[#8ca0b3] font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={targetCompany}
                                            onChange={(e) => setTargetCompany(e.target.value)}
                                            placeholder="e.g., Google, Microsoft, Amazon"
                                            className={inputClass}
                                        />
                                    </div>

                                    {/* Focus Topics */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>
                                            <ListChecks className="w-4 h-4 mr-2 text-[#0f766e]" aria-hidden="true" />
                                            Focus Topics
                                            <span className="ml-2 text-xs text-[#8ca0b3] font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={focusTopics}
                                            onChange={(e) => setFocusTopics(e.target.value)}
                                            placeholder="e.g., System Design, Data Structures, Algorithms"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                        className={`w-full py-4 rounded-[14px] bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] text-white font-semibold shadow-[0_8px_20px_rgba(217,85,43,0.28)] hover:shadow-[0_10px_24px_rgba(217,85,43,0.34)] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_8px_20px_rgba(217,85,43,0.28)] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                            <span className="text-lg">Generating Questions...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" aria-hidden="true" />
                                            <span className="text-lg">Generate Questions</span>
                                            <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                        </>
                                    )}
                                </button>
                            </form>
                            )} {/* end mode === "form" */}

                        </div>
                    </div>


                    {/* Right Side - Info panel (dark navy) */}
                    <div className="lg:col-span-2">
                        <div className="h-full bg-[#0f1e2e] rounded-[24px] border border-white/10 shadow-[0_12px_32px_rgba(15,30,46,0.22)] p-6 lg:p-8 space-y-7 text-white flex flex-col">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-xs font-medium text-[#d9efea]">
                                    <Star className="w-3.5 h-3.5 text-[#ff6a3d]" aria-hidden="true" />
                                    Tidepool Studio · Calm practice
                                </div>
                                <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight tracking-tight" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>
                                    <span className="text-white">
                                        Ace Your
                                    </span>
                                    <br />
                                    <span className="text-[#d9efea]">Next Interview</span>
                                </h1>

                                <p className="text-base lg:text-lg text-white/70 leading-relaxed">
                                    Get personalized mock interview questions tailored to your role and experience level.
                                    Practice with confidence and land your dream job.
                                </p>
                            </div>

                            {/* Job Categories */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <Star className="w-5 h-5 text-[#ff6a3d] mr-2" aria-hidden="true" />
                                    Popular Categories
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {jobCategories.slice(0, 4).map((category, index) => (
                                        <div key={index} className="bg-[#172b43] border border-white/10 rounded-[18px] p-4 hover:bg-[#1b3350] hover:-translate-y-px transition-all duration-200 group cursor-pointer">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-[#0f766e] rounded-[10px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
                                                    <category.icon className="w-5 h-5 text-white" aria-hidden="true" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-white text-sm">{category.title}</h4>
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        {category.roles.slice(0, 3).map((role, roleIndex) => (
                                                            <span key={roleIndex} className="text-xs bg-white/10 border border-white/10 text-[#d9efea] px-2 py-1 rounded-full">
                                                                {role}
                                                            </span>
                                                        ))}
                                                        {category.roles.length > 2 && (
                                                            <span className="text-xs text-white/50 px-2 py-1">
                                                                +{category.roles.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Success Stats */}
                            <div className="bg-[#172b43] border border-white/10 rounded-[18px] p-6 mt-auto">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="space-y-1">
                                        <div className="text-2xl font-bold text-white">10K+</div>
                                        <div className="text-sm text-white/60">Questions</div>
                                    </div>
                                    <div className="space-y-1 border-x border-white/10">
                                        <div className="text-2xl font-bold text-white">95%</div>
                                        <div className="text-sm text-white/60">Success Rate</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-2xl font-bold text-white">50+</div>
                                        <div className="text-sm text-white/60">Job Roles</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
