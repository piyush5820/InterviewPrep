"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import InterviewQuestion from "@/components/InterviewQuestion";
import { useRouter } from "next/navigation";
import { auth, saveInterview } from "@/firebase/firebase";
import { Clock, MessageSquare, User, ArrowLeft, CheckCircle, Camera, CameraOff, Menu, X, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import WebcamPreview from "@/components/WebcamPreview";
import { useToast } from "@/components/ToastProvide";
import { useGeminiLive, LIVE_MAX_TOTAL_FOLLOW_UPS } from "@/hooks/useGeminiLive";
import { InterviewQuestionData, normalizeQuestions } from "@/lib/questions";

const questionPrefixes = [
    "Let's talk about",
    "Tell me about",
    "Please explain",
    "Could you share",
    "Let's discuss",
    "I'd like to hear about",
    "Can you describe",
    "Please elaborate on",
    "Share your thoughts on",
    "Let's go over",
    "Give me your thoughts on",
    "Please tell me about",
    "Walk me through",
    "Talk to me about",
];


export default function InterviewPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [questions, setQuestions] = useState<InterviewQuestionData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [feedbacks, setFeedbacks] = useState<Record<number, string>>({});
    const [scores, setScores] = useState<Record<number, number>>({});
    const [interviewType, setInterviewType] = useState<string>("");
    const [interviewRole, setInterviewRole] = useState<string>("");
    const [skills, setSkills] = useState<string>("");
    const [timer, setTimer] = useState(0);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isWebcamVisible, setIsWebcamVisible] = useState(false);
    const [isWebcamMinimized, setIsWebcamMinimized] = useState(true);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(false);
    const [isLiveConnecting, setIsLiveConnecting] = useState(false);
    const [hasLiveStarted, setHasLiveStarted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoLiveStartedRef = useRef(false);
    const liveCompletionHandledRef = useRef(false);

    const {
        isConnected: isLiveConnected,
        isSpeaking: isLiveSpeaking,
        transcript: liveTranscript,
        transcriptEntries: liveTranscriptEntries,
        error: liveError,
        isComplete: isLiveComplete,
        liveQuestionIndex: livePlanIndex,
        liveTotalFollowUps,
        connect: connectLive,
        disconnect: disconnectLive,
    } = useGeminiLive();

    useEffect(() => {
        if (!isTtsEnabled || questions.length === 0 || !questions[currentIndex] || !window.speechSynthesis) {
            if (!window.speechSynthesis) {
                console.warn("Web Speech API not supported in this browser.");
                showToast("❌ Text-to-speech is not supported in your browser.", "error");
            }
            return;
        }

        const playQuestionAudio = () => {
            try {
                window.speechSynthesis.cancel();
                const prefix = questionPrefixes[currentIndex % questionPrefixes.length];
                const qObj = questions[currentIndex];
                const qText = typeof qObj === "string" ? qObj : qObj?.text ?? "";
                const utterance = new SpeechSynthesisUtterance(`${prefix}, ${qText}`);
                utterance.lang = "en-US";
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                const voices = window.speechSynthesis.getVoices();
                const femaleVoice = voices.find((voice) => voice.lang === "en-US" && (voice.name.includes("female") || voice.name.includes("Google US English")));
                if (femaleVoice) {
                    utterance.voice = femaleVoice;
                }
                window.speechSynthesis.speak(utterance);
                utterance.onerror = (event) => {
                    console.error("Speech synthesis error:", event.error);
                    showToast(`❌ Failed to play audio: ${event.error}. Please check browser settings.`, "error");
                };
            } catch (error) {
                console.error("TTS error:", error);
                showToast(`❌ Failed to generate audio: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
            }
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(playQuestionAudio, 1000);
            };
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(playQuestionAudio, 1000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            window.speechSynthesis.cancel();
        };
    }, [currentIndex, questions, isTtsEnabled, showToast]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log("Auth state in InterviewPage:", user ? `User ${user.uid}` : "No user");
            if (!user) {
                showToast("❌ Please sign in to continue.", "error");
                router.push("/auth");
                setIsLoadingAuth(false);
                return;
            }

            // Only clear localStorage if no valid session exists
            const storedQuestions = localStorage.getItem("questions");
            if (!storedQuestions) {
                localStorage.removeItem("userAnswers");
                localStorage.removeItem("feedbacks");
                localStorage.removeItem("scores");
                localStorage.removeItem("currentQuestionIndex");
                localStorage.removeItem("interviewType");
                localStorage.removeItem("interviewRole");
                localStorage.removeItem("skills");

                showToast("⚠️ No active interview session. Redirecting to setup...", "error");
                router.push("/homeform");
                setIsLoadingAuth(false);
                return;
            }

            // Retrieve and validate data from localStorage
            try {
                const parsed = JSON.parse(storedQuestions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const normalized = normalizeQuestions(parsed);

                    setQuestions(normalized.length > 10 ? normalized.slice(0, 10) : normalized);
                } else {
                    throw new Error("Questions list is empty");
                }
            } catch (error) {
                console.error("Error parsing questions from localStorage:", error);
                showToast("⚠️ Interview session expired. Please start a new session.", "error");
                router.push("/homeform");
                setIsLoadingAuth(false);
                return;
            }

            const storedInterviewType = localStorage.getItem("interviewType");
            const storedInterviewRole = localStorage.getItem("interviewRole");
            const storedSkills = localStorage.getItem("skills");
            const idx = localStorage.getItem("currentQuestionIndex");

            if (storedInterviewType && ["Technical", "HR", "Managerial", "Mixed"].includes(storedInterviewType)) {
                setInterviewType(storedInterviewType);
            } else if (storedInterviewType) {
                console.warn("Invalid interviewType in localStorage:", storedInterviewType);
                localStorage.removeItem("interviewType");
            }

            if (storedInterviewRole && storedInterviewRole.trim()) {
                setInterviewRole(storedInterviewRole);
            } else if (storedInterviewRole) {
                console.warn("Invalid interviewRole in localStorage:", storedInterviewRole);
                localStorage.removeItem("interviewRole");
            }
            if (storedSkills && storedSkills.trim()) {
                setSkills(storedSkills);
            } else if (storedSkills) {
                console.warn("Invalid skills in localstorage: ", storedSkills);
                localStorage.removeItem("skills");
            }

            if (idx && !isNaN(parseInt(idx))) {
                setCurrentIndex(parseInt(idx));
            }

            setIsLoadingAuth(false);
        });
        return () => unsubscribe();
    }, [router, showToast]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [currentIndex]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const getQuestionText = (question: string | { text: string; isCoding: boolean } | undefined) => {
        if (!question) return "";
        return typeof question === "string" ? question : question.text;
    };

    const goToQuestion = (index: number) => {
        const boundedIndex = Math.min(Math.max(index, 0), questions.length - 1);
        setCurrentIndex(boundedIndex);
        setTimer(0);
        localStorage.setItem("currentQuestionIndex", boundedIndex.toString());
    };

    const handleNext = async (userAnswer: string) => {
        const user = auth.currentUser;
        console.log("HandleNext user:", user ? `User ${user.uid}` : "No user");
        if (!user) {
            showToast("❌ Authentication required.", "error");
            router.push("/auth");
            return;
        }

        const answerIndex = currentIndex;
        const currentQuestion = questions[answerIndex];
        const questionText = getQuestionText(currentQuestion);
        const isCodingQuestion = !!currentQuestion?.isCoding;
        const updatedUserAnswers = { ...userAnswers, [answerIndex]: userAnswer };
        setUserAnswers(updatedUserAnswers);
        localStorage.setItem("userAnswers", JSON.stringify(updatedUserAnswers));

        const isLastQuestion = answerIndex >= questions.length - 1;
        if (!isLastQuestion) {
            goToQuestion(answerIndex + 1);
            console.log(`Moving to question ${answerIndex + 2}`);
        }

        let updatedFeedbacks = { ...feedbacks };
        let updatedScores = { ...scores };

                if (userAnswer === "Skipped") {
                        try {
                                console.log(`Fetching ideal answer for question ${answerIndex + 1}: ${questionText}`);
                                const response = await fetch("/api/getIdealAnswer", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ question: questionText, isCoding: isCodingQuestion }),
                                });
                if (!response.ok) {
                    throw new Error(await response.text());
                }
                const data = await response.json();
                const idealAnswer = data.idealAnswer;
                updatedFeedbacks = {
                    ...feedbacks,
                    [answerIndex]: `Ideal Answer: ${idealAnswer}`,
                };
                setFeedbacks(updatedFeedbacks);
                localStorage.setItem("feedbacks", JSON.stringify(updatedFeedbacks));
                console.log(`Ideal answer saved for question ${answerIndex + 1}`);
            } catch (error) {
                console.error("Error fetching ideal answer:", error);
                showToast("❌ Failed to fetch ideal answer.", "error");
                updatedFeedbacks = {
                    ...feedbacks,
                    [answerIndex]: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
                };
                setFeedbacks(updatedFeedbacks);
                localStorage.setItem("feedbacks", JSON.stringify(updatedFeedbacks));
            }
        } else {
                        try {
                                console.log(`Evaluating answer for question ${answerIndex + 1}: ${questionText}`);
                                const response = await fetch("/api/evaluateAnswer", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ question: questionText, userAnswer, isCoding: isCodingQuestion }),
                                });
                if (!response.ok) {
                    throw new Error(await response.text());
                }
                const data = await response.json();
                const evaluation = data.evaluation;
                const match = evaluation.match(/(?:\*\*)?Score:(?:\*\*)?\s*(\d+)(?:\/10)?/i);
                const score = match ? parseInt(match[1]) : 0;

                updatedFeedbacks = { ...feedbacks, [answerIndex]: evaluation };
                updatedScores = { ...scores, [answerIndex]: score };

                setFeedbacks(updatedFeedbacks);
                setScores(updatedScores);

                localStorage.setItem("feedbacks", JSON.stringify(updatedFeedbacks));
                localStorage.setItem("scores", JSON.stringify(updatedScores));
                console.log(`Evaluation saved for question ${answerIndex + 1}: Score ${score}`);
            } catch (error) {
                console.error("Evaluation error:", error);
                showToast("❌ Failed to evaluate answer.", "error");
                updatedFeedbacks = {
                    ...feedbacks,
                    [answerIndex]: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
                };
                setFeedbacks(updatedFeedbacks);
                localStorage.setItem("feedbacks", JSON.stringify(updatedFeedbacks));
            }
        }

        if (isLastQuestion) {
            setIsSaving(true);
            try {
                const questionsTextArray = questions.map(getQuestionText);
                console.log("Saving interview to Firebase:", {
                    userId: user.uid,
                    questions: questionsTextArray,
                    answers: updatedUserAnswers,
                    feedbacks: updatedFeedbacks,
                    scores: updatedScores,
                    interviewType,
                    interviewRole,
                    skills,
                });
                await saveInterview(user.uid, {
                    questions: questionsTextArray,
                    answers: updatedUserAnswers,
                    feedbacks: updatedFeedbacks,
                    scores: updatedScores,
                    interviewType,
                    interviewRole,
                    skills,
                    createdAt: new Date().toISOString(),
                });
                showToast("✅ Interview saved successfully!", "success");
                // Clear localStorage to prevent stale data
                localStorage.removeItem("questions");
                localStorage.removeItem("userAnswers");
                localStorage.removeItem("feedbacks");
                localStorage.removeItem("scores");
                localStorage.removeItem("currentQuestionIndex");
                localStorage.removeItem("interviewType");
                localStorage.removeItem("interviewRole");
                localStorage.removeItem("skills");
                console.log("Interview saved successfully, redirecting to /results");
                router.push("/results");
            } catch (error) {
                console.error("Error saving interview:", error);
                showToast("❌ Failed to save interview.", "error");
                router.push("/results");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            goToQuestion(currentIndex - 1);
        }
    };

    const toggleSidePanel = () => {
        setIsSidePanelOpen(!isSidePanelOpen);
    };

    const toggleWebcam = () => {
        if (isWebcamVisible) {
            setIsWebcamVisible(false);
            if (webcamStream) {
                webcamStream.getTracks().forEach((track) => track.stop());
                setWebcamStream(null);
            }
        } else {
            setIsWebcamVisible(true);
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: false })
                .then((stream) => {
                    setWebcamStream(stream);
                })
                .catch((error) => {
                    console.error("Error accessing camera:", error);
                    showToast("❌ Error accessing camera.", "error");
                    setIsWebcamVisible(false);
                });
        }
    };

    const toggleWebcamSize = () => {
        setIsWebcamMinimized(!isWebcamMinimized);
    };

    const toggleTts = () => {
        setIsTtsEnabled(!isTtsEnabled);
        if (!isTtsEnabled && questions[currentIndex] && window.speechSynthesis) {
            replayQuestion();
        } else {
            window.speechSynthesis.cancel();
        }
    };

    const processliveInterviewAndSave = async (liveTranscript: string) => {
        const hasCandidateAnswer = liveTranscriptEntries.some((entry) => entry.speaker === "Candidate" && entry.text.trim().length > 5);

        if (liveError) {
            showToast("❌ Live Voice had a connection error, so I won't auto-save this interview.", "error");
            return;
        }

        if (!liveTranscript.trim() || !hasCandidateAnswer) {
            showToast("❌ No candidate answer recorded yet. Please continue the live interview before saving.", "error");
            return;
        }

        try {
            setIsSaving(true);
            showToast("⏳ Processing Live Voice interview...", "success");

            // Call the new API endpoint to process transcript and generate evaluations
            const response = await fetch("/api/processLiveInterview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questions: questions.map(getQuestionText),
                    transcript: liveTranscript,
                }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const {
                questions: evaluatedQuestions,
                answers,
                feedbacks,
                scores,
                summary: liveSummary,
            } = await response.json();
            const user = auth.currentUser;

            if (!user) {
                showToast("❌ Not authenticated. Please sign in.", "error");
                return;
            }

            // Save the interview with generated answers/feedbacks/scores.
            // questions/answers/feedbacks/scores come from the Gemini Live
            // audio-to-audio transcript (never the WebRTC mic transcript path).
            const questionsTextArray = Array.isArray(evaluatedQuestions) && evaluatedQuestions.length > 0
                ? evaluatedQuestions.map((question) => String(question))
                : questions.map(getQuestionText);
            await saveInterview(user.uid, {
                questions: questionsTextArray,
                answers,
                feedbacks,
                scores,
                interviewType,
                interviewRole,
                skills,
                summary: liveSummary,
                createdAt: new Date().toISOString(),
            });

            showToast("✅ Live Voice interview completed and saved!", "success");
            
            // Clear localStorage and redirect to results
            localStorage.removeItem("questions");
            localStorage.removeItem("userAnswers");
            localStorage.removeItem("feedbacks");
            localStorage.removeItem("scores");
            localStorage.removeItem("currentQuestionIndex");
            localStorage.removeItem("interviewType");
            localStorage.removeItem("interviewRole");
            localStorage.removeItem("skills");
            
            router.push("/results");
        } catch (error) {
            console.error("Error processing live interview:", error);
            showToast(
                `❌ Failed to process interview: ${error instanceof Error ? error.message : "Unknown error"}`,
                "error"
            );
        } finally {
            setIsSaving(false);
        }
    };

    const startLiveMode = useCallback(async (isAutoStart = false) => {
        if (isLiveConnected || isLiveConnecting || questions.length === 0) return;

        setIsLiveConnecting(true);
        liveCompletionHandledRef.current = false;
        setIsTtsEnabled(false);
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        const experienceLevel = localStorage.getItem("experienceLevel") || "Mid-Level";
        const targetCompany = localStorage.getItem("targetCompany") || "our company";
        const focusTopics = localStorage.getItem("focusTopics") || "core subjects";

        showToast(isAutoStart ? "🎙️ Starting Live Voice interview..." : "🎙️ Initializing Live Voice Mode...", "success");

        try {
            await connectLive({
                jobProfile: interviewRole || "Software Engineer",
                experienceLevel,
                skills: skills || "Software Development",
                interviewType: interviewType || "Technical",
                targetCompany,
                focusTopics,
                questions: questions.map(getQuestionText),
                currentIndex,
            });
            showToast("🎙️ Live Voice Mode connected.", "success");
        } catch (err) {
            console.error("Live connect failed:", err);
            showToast(`❌ Live Voice failed: ${err instanceof Error ? err.message : String(err)}`, "error");
        } finally {
            setIsLiveConnecting(false);
        }
    }, [connectLive, currentIndex, interviewRole, interviewType, isLiveConnected, isLiveConnecting, questions, showToast, skills]);

    const toggleLiveMode = async () => {
        if (isLiveConnecting) return;

        if (!isLiveConnected) {
            await startLiveMode();
            return;
        }

        // When disconnecting from Live Voice, process the transcript and save
        if (liveTranscript.trim() && !liveError) {
            liveCompletionHandledRef.current = true;
            await processliveInterviewAndSave(liveTranscript);
        } else if (liveError) {
            showToast("❌ Live Voice had a connection error. Stopping without saving.", "error");
        }
        disconnectLive();
        showToast("🎙️ Live Voice Mode deactivated.", "success");
    };

    useEffect(() => {
        if (isLoadingAuth || questions.length === 0 || autoLiveStartedRef.current) return;

        autoLiveStartedRef.current = true;
        void startLiveMode(true);
    }, [isLoadingAuth, questions.length, startLiveMode]);

    useEffect(() => {
        if (liveError) {
            setIsLiveConnecting(false);
            showToast(`❌ Live Voice: ${liveError}`, "error");
        }
    }, [liveError, showToast]);

    // Auto-save once when the interviewer closes the interview
    // ("This concludes the interview. Goodbye."). Guarded so manual
    // disconnect and this effect can never double-save the same session.
    useEffect(() => {
        if (!isLiveComplete || liveCompletionHandledRef.current || isSaving || isLiveConnecting) return;
        if (!liveTranscript.trim() || liveError) return;
        liveCompletionHandledRef.current = true;
        showToast("✅ Live Voice interview finished — saving with delivery summary...", "success");
        void processliveInterviewAndSave(liveTranscript);
    });

    useEffect(() => {
        return () => {
            disconnectLive();
        };
    }, [disconnectLive]);

    const replayQuestion = () => {
        if (!questions[currentIndex] || !window.speechSynthesis) {
            if (!window.speechSynthesis) {
                showToast("❌ Text-to-speech is not supported in your browser.", "error");
            }
            return;
        }

        try {
            window.speechSynthesis.cancel();
            const prefix = questionPrefixes[currentIndex % questionPrefixes.length];
            const qObj = questions[currentIndex];
            const qText = typeof qObj === "string" ? qObj : qObj?.text ?? "";
            const utterance = new SpeechSynthesisUtterance(`${prefix}, ${qText}`);
            utterance.lang = "en-US";
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find((voice) => voice.lang === "en-US" && (voice.name.includes("female") || voice.name.includes("Google US English")));
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            window.speechSynthesis.speak(utterance);
            utterance.onerror = (event) => {
                console.error("Speech synthesis error:", event.error);
                showToast(`❌ Failed to play audio: ${event.error}. Please check browser settings.`, "error");
            };
        } catch (error) {
            console.error("TTS replay error:", error);
            showToast(`❌ Failed to replay audio: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
        }
    };

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen bg-[#f3f6f8] flex items-center justify-center">
                <div className="bg-white border border-[#dde5ec] shadow-[0_12px_32px_rgba(15,30,46,0.08)] rounded-[24px] p-8 max-w-md w-full mx-4 text-center animate-pulse">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-[#d9efea] border-t-[#0f766e] rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-[#f0f4f7] border-t-[#0f766e] rounded-full animate-spin"></div>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#0f1e2e] mb-2" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Loading...</h2>
                    <p className="text-[#5a6d80]">Checking authentication status</p>
                </div>
            </div>
        );
    }

    if (isSaving) {
        return (
            <div className="min-h-screen bg-[#f3f6f8] flex items-center justify-center">
                <div className="bg-white border border-[#dde5ec] shadow-[0_12px_32px_rgba(15,30,46,0.08)] rounded-[24px] p-8 max-w-md w-full mx-4 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-[#d9efea] border-t-[#0f766e] rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-[#f0f4f7] border-t-[#0f766e] rounded-full animate-spin"></div>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#0f1e2e] mb-2" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Saving Interview...</h2>
                    <p className="text-[#5a6d80]">Please wait while we save your responses</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#f3f6f8] flex items-center justify-center">
                <div className="bg-white border border-[#dde5ec] shadow-[0_12px_32px_rgba(15,30,46,0.08)] rounded-[24px] p-8 max-w-md w-full mx-4 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-[#d9efea] border-t-[#0f766e] rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-[#f0f4f7] border-t-[#0f766e] rounded-full animate-spin"></div>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#0f1e2e] mb-2" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Loading Questions...</h2>
                    <p className="text-[#5a6d80]">Preparing your personalized interview</p>
                </div>
            </div>
        );
    }

    // In Live Voice mode the interviewer walks the planned list itself, so the
    // counter follows live coverage (livePlanIndex) instead of the frozen manual index.
    const displayIndex = (isLiveConnected || isLiveConnecting) && questions.length > 0
        ? Math.min(livePlanIndex, questions.length - 1)
        : currentIndex;
    const progressPercent = questions.length > 0 ? ((displayIndex + 1) / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#f3f6f8] text-[#0f1e2e] relative overflow-hidden">
            <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#dde5ec]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                            <button
                                onClick={() => router.back()}
                                aria-label="Go back"
                                className="p-2 bg-white border border-[#dde5ec] hover:bg-[#f0f4f7] rounded-[10px] transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
                            >
                                <ArrowLeft className="w-5 h-5 text-[#5a6d80] group-hover:text-[#0f1e2e]" aria-hidden="true" />
                            </button>
                            <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-10 bg-[#0f766e] rounded-[14px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(15,118,110,0.25)]">
                                    <MessageSquare className="w-5 h-5 text-white" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="font-display text-base sm:text-lg font-bold text-[#0f1e2e] truncate" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Interview Practice</h1>
                                    <p className="text-xs sm:text-sm text-[#5a6d80] truncate">
                                        {interviewType} Interview for {interviewRole}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="flex items-center space-x-2 bg-white border border-[#dde5ec] shadow-[0_4px_12px_rgba(15,30,46,0.06)] rounded-full px-4 py-2">
                                    <MessageSquare className="w-4 h-4 text-[#0f766e]" aria-hidden="true" />
                                    <span className="text-sm text-[#0f1e2e] font-semibold">Question {displayIndex + 1}/{questions.length}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-28 lg:w-32 h-2 bg-[#f0f4f7] rounded-full overflow-hidden border border-[#dde5ec]">
                                        <div
                                            className="h-full bg-[#0f766e] transition-all duration-200 ease-out rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-semibold text-[#0f1e2e] min-w-[3rem]">{Math.round(progressPercent)}%</span>
                                </div>
                            </div>
                            <button
                                onClick={toggleTts}
                                aria-label={isTtsEnabled ? "Disable text to speech" : "Enable text to speech"}
                                aria-pressed={isTtsEnabled}
                                className={`p-2.5 rounded-[10px] transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${isTtsEnabled ? "bg-[#0f1e2e] border-[#0f1e2e] text-white shadow-[0_4px_12px_rgba(15,30,46,0.18)]" : "bg-white border-[#dde5ec] text-[#5a6d80] hover:bg-[#f7fafb] hover:text-[#0f1e2e]"}`}
                            >
                                {isTtsEnabled ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
                            </button>
                            <button
                                onClick={toggleLiveMode}
                                disabled={isLiveConnecting}
                                aria-label={isLiveConnected ? "Disconnect voice interviewer" : "Connect live voice interviewer"}
                                className={`p-2.5 rounded-[10px] transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] flex items-center space-x-2 disabled:opacity-60 ${isLiveConnected || isLiveConnecting ? "bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] border-transparent text-white shadow-[0_4px_14px_rgba(217,85,43,0.35)] animate-pulse" : "bg-white border-[#dde5ec] text-[#5a6d80] hover:bg-[#f7fafb] hover:text-[#0f1e2e]"}`}
                                title={isLiveConnected ? "Disconnect Voice Interviewer" : isLiveConnecting ? "Connecting Live Voice Interviewer" : "Connect Live Voice Interviewer"}
                            >
                                {isLiveConnected || isLiveConnecting ? <Mic className="w-5 h-5" aria-hidden="true" /> : <MicOff className="w-5 h-5" aria-hidden="true" />}
                                <span className="text-xs font-semibold hidden md:inline">
                                    {isLiveConnecting ? "Starting Live..." : isLiveConnected ? "Live Connected" : "Go Live Voice"}
                                </span>
                            </button>
                            <button
                                onClick={toggleSidePanel}
                                aria-label="Open questions panel"
                                className="p-2.5 bg-white hover:bg-[#f0f4f7] rounded-[10px] transition-all duration-200 lg:hidden border border-[#dde5ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
                            >
                                <Menu className="w-5 h-5 text-[#0f1e2e]" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                    {/* Mobile progress */}
                    <div className="sm:hidden mt-3 flex items-center space-x-2">
                        <div className="flex-1 h-1.5 bg-[#f0f4f7] rounded-full overflow-hidden border border-[#dde5ec]">
                            <div className="h-full bg-[#0f766e] transition-all duration-200 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-[#0f1e2e]">Q {displayIndex + 1}/{questions.length}</span>
                    </div>
                </div>
            </header>

            <div className="pt-28 sm:pt-24 pb-8 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                        <div className="lg:col-span-3 space-y-6">
                            {/* Main Interview Question Card */}
                            <div className="bg-white border border-[#dde5ec] shadow-[0_12px_32px_rgba(15,30,46,0.08)] rounded-[24px] overflow-hidden">
                                <div className="bg-[#f7fafb] border-b border-[#dde5ec] p-5 sm:p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div className="w-11 h-11 bg-[#0f766e] rounded-[14px] flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-white" aria-hidden="true" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm sm:text-base font-semibold text-[#0f1e2e]">PreplystHub - AI</span>
                                                <p className="text-xs sm:text-sm text-[#5a6d80]">Question {displayIndex + 1} of {questions.length}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-white border border-[#dde5ec] rounded-full px-4 py-2 shadow-[0_2px_8px_rgba(15,30,46,0.05)] shrink-0">
                                            <Clock className="w-4 h-4 text-[#0f766e]" aria-hidden="true" />
                                            <span className="font-mono text-sm text-[#0f1e2e] font-semibold">{formatTime(timer)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 sm:p-8">
                                    {isLiveConnected || isLiveConnecting ? (
                                        <div className="bg-[#0f1e2e] rounded-[18px] p-6 sm:p-8 flex flex-col items-center justify-center space-y-6 animate-fade-in border border-white/10">
                                            {/* Calm teal pulse rings */}
                                            <div className="relative flex items-center justify-center w-36 h-36">
                                                <div className={`absolute w-full h-full rounded-full bg-[#0f766e]/20 border border-[#0f766e]/30 transition-all duration-200 ${isLiveSpeaking ? "scale-125 opacity-100 animate-ping" : "scale-100 opacity-40"}`}></div>
                                                <div className={`absolute w-28 h-28 rounded-full bg-[#0f766e]/25 border border-[#0f766e]/40 transition-all duration-200 ${isLiveSpeaking ? "scale-110 animate-pulse" : "scale-100"}`}></div>
                                                <div className="relative z-10 w-20 h-20 bg-[#0f766e] rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(15,118,110,0.45)]">
                                                    <Mic className={`w-9 h-9 text-white ${isLiveSpeaking ? "animate-bounce" : ""}`} aria-hidden="true" />
                                                </div>
                                            </div>

                                            <div className="text-center space-y-2">
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase bg-white/10 border border-white/15 text-white/85 px-3 py-1.5 rounded-full">
                                                        Planned {Math.min(displayIndex + 1, questions.length)} of {questions.length}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-full border ${liveTotalFollowUps > 0 ? "bg-[#ff6a3d]/15 border-[#ff6a3d]/40 text-[#ffb59d]" : "bg-white/10 border-white/15 text-white/60"}`}>
                                                        {liveTotalFollowUps}/{LIVE_MAX_TOTAL_FOLLOW_UPS} follow-ups
                                                    </span>
                                                </div>
                                                <h3 className="font-display text-xl font-bold text-white tracking-tight" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>
                                                    {isLiveConnecting ? "Starting Live Voice interview..." : isLiveSpeaking ? "AI Interviewer is speaking..." : "Listening to you..."}
                                                </h3>
                                                <p className="text-sm text-white/65 max-w-md mx-auto leading-relaxed">
                                                    {isLiveConnecting ? "Requesting microphone access and preparing your AI interviewer." : "Speak naturally. You can interrupt the AI at any time if you want to clarify or add details!"}
                                                </p>
                                            </div>

                                            {/* Live Transcription Box */}
                                            <div className="w-full max-w-2xl bg-[#172b43] border border-white/10 rounded-[14px] p-5 min-h-[140px] max-h-[260px] overflow-y-auto custom-scrollbar">
                                                <div className="text-xs font-semibold text-[#8ca0b3] mb-3 uppercase tracking-widest flex items-center space-x-2">
                                                    <span className="w-2 h-2 bg-[#0f766e] rounded-full animate-pulse"></span>
                                                    <span>Real-time Live Transcript</span>
                                                </div>
                                                {liveTranscriptEntries.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {liveTranscriptEntries.map((entry, transcriptIndex) => (
                                                            <div
                                                                key={`${entry.speaker}-${transcriptIndex}`}
                                                                className={`rounded-[10px] border p-3 ${entry.speaker === "Interviewer" ? "border-white/10 bg-white/5" : "border-[#0f766e]/40 bg-[#d9efea]"}`}
                                                            >
                                                                <div className={`mb-1 text-[11px] font-semibold uppercase tracking-widest ${entry.speaker === "Interviewer" ? "text-[#8ca0b3]" : "text-[#0b5d57]"}`}>
                                                                    {entry.speaker}
                                                                </div>
                                                                <p className={`text-sm leading-relaxed font-medium whitespace-pre-wrap ${entry.speaker === "Interviewer" ? "text-white" : "text-[#0f1e2e]"}`}>
                                                                    {entry.text}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-white/55 leading-relaxed font-medium">
                                                        {isLiveConnecting ? "Waiting for the Live Voice session to start..." : "Your conversation history will stream here in real-time as you speak..."}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <InterviewQuestion
                                                question={questions[currentIndex]}
                                                index={currentIndex + 1}
                                                total={questions.length}
                                                onNext={handleNext}
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#dde5ec]">
                                                <button
                                                    onClick={handlePrevious}
                                                    disabled={currentIndex === 0}
                                                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-[10px] transition-all duration-200 text-sm font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${currentIndex === 0 ? "bg-[#f7fafb] text-[#8ca0b3] cursor-not-allowed border-[#dde5ec]" : "bg-white text-[#0f1e2e] hover:bg-[#f7fafb] border-[#dde5ec] shadow-[0_2px_8px_rgba(15,30,46,0.06)]"}`}
                                                >
                                                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                                                    <span>Previous</span>
                                                </button>
                                                <div className="text-center py-3">
                                                    <div className="text-sm text-[#5a6d80]">
                                                        {currentIndex < questions.length - 1 ? "Keep going! You're doing amazing!" : "Final question - finish strong!"}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={replayQuestion}
                                                    className="flex items-center justify-center space-x-2 px-6 py-3 rounded-[10px] bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] text-white font-semibold shadow-[0_6px_16px_rgba(217,85,43,0.28)] hover:shadow-[0_8px_20px_rgba(217,85,43,0.34)] transition-all duration-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] focus-visible:ring-offset-2"
                                                >
                                                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                                                    <span>Play Question</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Pro Tips Card */}
                            <div className="bg-[#d9efea] border border-[#dde5ec] rounded-[24px] p-6 shadow-[0_8px_24px_rgba(15,118,110,0.10)]">
                                <h3 className="font-display text-lg font-semibold text-[#0f1e2e] mb-4 flex items-center" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>
                                    <div className="w-8 h-8 bg-[#0f766e] rounded-[10px] flex items-center justify-center mr-3 shrink-0">
                                        <MessageSquare className="w-4 h-4 text-white" aria-hidden="true" />
                                    </div>
                                    Pro Interview Tips
                                </h3>
                                <div className="grid sm:grid-cols-3 gap-5 text-sm">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-[#0f766e] rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-[#0f1e2e]/80">Take time to think before answering</span>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-[#0f766e] rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-[#0f1e2e]/80">Use specific examples from experience</span>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-[#0f766e] rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-[#0f1e2e]/80">Structure answers clearly and concisely</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            {/* Camera Section */}
                            <div className="bg-[#0f1e2e] border border-white/10 rounded-[24px] p-6 shadow-[0_12px_32px_rgba(15,30,46,0.22)]">
                                <div className="flex items-center justify-between mb-5 gap-2">
                                    <h3 className="font-display text-lg font-semibold text-white" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Camera</h3>
                                    <button
                                        onClick={toggleWebcam}
                                        aria-pressed={isWebcamVisible}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-[10px] transition-all duration-200 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${isWebcamVisible ? "bg-white/10 text-white border border-white/15 hover:bg-white/15" : "bg-[#0f766e] text-white shadow-[0_4px_12px_rgba(15,118,110,0.35)] hover:bg-[#0b5d57]"}`}
                                    >
                                        {isWebcamVisible ? (
                                            <>
                                                <CameraOff className="w-4 h-4" aria-hidden="true" />
                                                <span>Turn Off</span>
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="w-4 h-4" aria-hidden="true" />
                                                <span>Turn On</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                {isWebcamVisible && (
                                    <div className="space-y-4">
                                        <WebcamPreview
                                            onToggleSize={toggleWebcamSize}
                                            isActive={isWebcamVisible}
                                        />
                                        <p className="text-sm text-white/60 text-center">
                                            Practice your body language and expressions
                                        </p>
                                    </div>
                                )}
                                {!isWebcamVisible && (
                                    <div className="aspect-video bg-[#172b43] rounded-[14px] flex items-center justify-center border border-white/10">
                                        <div className="text-center">
                                            <Camera className="w-10 h-10 text-white/30 mx-auto mb-3" aria-hidden="true" />
                                            <p className="text-sm text-white/55">Camera is off</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Questions List */}
                            <div className="hidden lg:block bg-white border border-[#dde5ec] shadow-[0_8px_24px_rgba(15,30,46,0.07)] rounded-[24px] p-6">
                                <h3 className="font-display text-lg font-semibold text-[#0f1e2e] mb-5" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>All Questions</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                                    {questions.map((question, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                goToQuestion(index);
                                            }}
                                            aria-current={index === currentIndex ? "true" : undefined}
                                            className={`w-full text-left p-4 rounded-[14px] transition-all duration-200 group border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${index === currentIndex ? "bg-[#d9efea] border-[#0f766e] text-[#0f1e2e] shadow-[0_4px_12px_rgba(15,118,110,0.15)]" : "bg-white border-[#dde5ec] text-[#5a6d80] hover:bg-[#f7fafb] hover:border-[#8ca0b3]"}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-sm font-semibold ${index === currentIndex ? "text-[#0b5d57]" : "text-[#0f766e]"}`}>Question {index + 1}</span>
                                                {index < currentIndex && (
                                                    <CheckCircle className="w-5 h-5 text-[#0f766e]" aria-hidden="true" />
                                                )}
                                                {index === currentIndex && (
                                                    <div className="w-2 h-2 bg-[#0f766e] rounded-full animate-pulse"></div>
                                                )}
                                            </div>
                                            <p className="text-sm text-[#5a6d80] line-clamp-2 group-hover:text-[#0f1e2e] transition-colors duration-200">{typeof question === 'string' ? question : question.text}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Side Panel */}
            <div className={`fixed inset-0 z-40 lg:hidden transform transition-transform duration-200 ${isSidePanelOpen ? "translate-x-0" : "translate-x-full"}`} aria-hidden={!isSidePanelOpen}>
                <div className="absolute inset-0 bg-[#0f1e2e]/45 backdrop-blur-sm" onClick={toggleSidePanel}></div>
                <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white border-l border-[#dde5ec] shadow-[0_12px_32px_rgba(15,30,46,0.18)]">
                    <div className="p-6 overflow-y-auto h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display text-lg font-semibold text-[#0f1e2e]" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>All Questions</h3>
                            <button
                                onClick={toggleSidePanel}
                                aria-label="Close questions panel"
                                className="p-2 bg-[#f7fafb] hover:bg-[#f0f4f7] border border-[#dde5ec] rounded-[10px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
                            >
                                <X className="w-5 h-5 text-[#0f1e2e]" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {questions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        goToQuestion(index);
                                        setIsSidePanelOpen(false);
                                    }}
                                    className={`w-full text-left p-4 rounded-[14px] transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${index === currentIndex ? "bg-[#d9efea] border-[#0f766e] text-[#0f1e2e]" : "bg-white border-[#dde5ec] text-[#5a6d80] hover:bg-[#f7fafb]"}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-[#0f766e]">Question {index + 1}</span>
                                        {index < currentIndex && (
                                            <CheckCircle className="w-5 h-5 text-[#0f766e]" aria-hidden="true" />
                                        )}
                                        {index === currentIndex && (
                                            <div className="w-3 h-3 bg-[#0f766e] rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#5a6d80] line-clamp-3">{typeof question === 'string' ? question : question.text}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.6s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(15, 118, 110, 0.35) transparent;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(15, 118, 110, 0.35);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(15, 118, 110, 0.55);
                }
            `}</style>
        </div>
    );
}
