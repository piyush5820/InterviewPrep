import { useEffect, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import CodeEditor from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { questionFromString } from "@/lib/questions";
import { Mic, Square, SkipForward, ArrowRight, Code2, MessageCircle } from "lucide-react";

export default function InterviewQuestion({
    question,
    index,
    total,
    onNext,
}: {
    question: string | { text: string; isCoding: boolean };
    index: number;
    total: number;
    onNext: (answer: string) => void;
}) {

    const normalizedQuestion = typeof question === "string" ? questionFromString(question) : question;
    const questionText = normalizedQuestion?.text ?? "";
    const isCodeQuestion = !!normalizedQuestion?.isCoding;

    const [codeAnswer, setCodeAnswer] = useState("");

    const { transcript, isListening, startListening, stopListening, resetTranscript } =
        useSpeechRecognition();
    useEffect(() => {
        resetTranscript();
        setCodeAnswer("");
    }, [question]);

    const handleNextClick = () => {
        if (isListening) {
            stopListening();
            resetTranscript();
        }

        if (isCodeQuestion) {
            onNext(codeAnswer || "// No code written");
        } else {
            onNext(transcript || "No answer recorded");
        }
    };

    const handleSkipClick = () => {
        if (isListening) {
            stopListening();
            resetTranscript();
        }
        onNext("Skipped");
    };

    return (
        <div className="rounded-2xl border border-[#dde5ec] bg-white shadow-[0_8px_28px_rgba(15,30,46,0.07)] p-5 sm:p-7 max-w-3xl mx-auto animate-rise">
            <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] uppercase text-[#0f766e] bg-[#d9efea] border border-[#0f766e]/20 px-3 py-1.5 rounded-full">
                    {isCodeQuestion ? <Code2 className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    Q{index} of {total} • {isCodeQuestion ? "Coding" : "Spoken"}
                </span>
                <span className="text-[12px] font-semibold text-[#8ca0b3]">{Math.round((index / total) * 100)}% through</span>
            </div>
            <h2 className="text-[17px] sm:text-[20px] font-semibold leading-relaxed text-[#0f1e2e] font-display mb-5">{questionText}</h2>

            {/* Show Code Editor if it's a code question */}
            {isCodeQuestion ? (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#0f1e2e]/15">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f1e2e] text-white text-[12px] font-semibold">
                        <span>Solution editor</span>
                        <span className="text-white/60">Auto-saved locally</span>
                    </div>
                    <CodeEditor
                        value={codeAnswer}
                        height="250px"
                        theme={dracula}
                        onChange={(value) => setCodeAnswer(value)}
                        extensions={[]}
                        style={{ fontSize: "14px" }}
                    />
                </div>
            ) : (
                <div className="rounded-xl border border-[#dde5ec] bg-[#f7fafb] p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            aria-pressed={isListening}
                            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold btn-transition ${
                                isListening
                                    ? "bg-[#d92d20] text-white shadow-[0_10px_24px_rgba(217,45,32,0.32)]"
                                    : "bg-[#0f766e] text-white shadow-[0_10px_24px_rgba(15,118,110,0.28)] hover:bg-[#0b5d57]"
                            }`}
                        >
                            {isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            {isListening ? "Stop Talking" : "Start Talking"}
                        </button>
                        {isListening && (
                            <span className="inline-flex items-center gap-2 text-[12px] font-bold text-[#d92d20]">
                                <span className="w-2 h-2 rounded-full bg-[#d92d20] animate-pulse" />
                                Listening — speak naturally
                            </span>
                        )}
                    </div>

                    {transcript ? (
                        <div className="mt-4 p-4 rounded-xl bg-white border border-[#dde5ec] animate-fadeIn">
                            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#5a6d80] mb-1.5">Your Answer</p>
                            <p className="text-[14px] leading-relaxed text-[#0f1e2e]">{transcript}</p>
                        </div>
                    ) : (
                        <p className="mt-3 text-[13px] text-[#8ca0b3]">Tap Start Talking, answer out loud, then press Next. Your transcript appears here.</p>
                    )}
                </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={handleSkipClick}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold text-[#5a6d80] bg-white border border-[#dde5ec] hover:border-[#c6d2dd] hover:bg-[#f0f4f7] btn-transition"
                >
                    <SkipForward className="w-4 h-4" />
                    Skip
                </button>
                <button
                    type="button"
                    onClick={handleNextClick}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold text-white bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] shadow-[0_10px_24px_rgba(255,106,61,0.32)] hover:brightness-[1.05] hover:-translate-y-[1px] btn-transition"
                >
                    Next
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
