"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { CheckCircle2, Lightbulb, MessageSquareText, Star } from "lucide-react";

interface ResultsSummaryProps {
    questions: string[];
    answers: { [key: number]: string };
    feedbacks: { [key: number]: string };
    scores: { [key: number]: number };
    interviewrole: string;
    interviewtype: string;
}

function scoreTone(score?: number) {
    if (score === undefined) return { bg: "bg-[#f0f4f7]", text: "text-[#5a6d80]", label: "Not evaluated" };
    if (score >= 8) return { bg: "bg-[#dff5e3]", text: "text-[#15803d]", label: `${score}/10 • Strong` };
    if (score >= 6) return { bg: "bg-[#fff0d2]", text: "text-[#9a5a0a]", label: `${score}/10 • Solid` };
    return { bg: "bg-[#fde3e1]", text: "text-[#d92d20]", label: `${score}/10 • Focus area` };
}

export default function ResultsSummary({
    questions,
    answers,
    feedbacks,
    scores,
    interviewrole,
    interviewtype,
}: ResultsSummaryProps) {
    return (
        <div className="space-y-4">
            {questions.map((question, index) => {
                const userAnswer = answers[index];
                const feedback = feedbacks[index];
                const cleanedFeedback = feedback?.replace(/^Ideal Answer:\s*/i, '').trim();
                const score = scores[index];
                const tone = scoreTone(score);

                return (
                    <article key={index} className="rounded-2xl border border-[#dde5ec] bg-white shadow-[0_6px_20px_rgba(15,30,46,0.06)] overflow-hidden">
                        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#eef2f6]">
                            <h2 className="text-[14px] sm:text-[15px] font-semibold leading-relaxed text-[#0f1e2e]">
                                <span className="text-[#0f766e] font-bold mr-1.5">Q{index + 1}</span>
                                {question}
                            </h2>
                            <span className={`shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-full ${tone.bg} ${tone.text}`}>
                                <Star className="w-3.5 h-3.5" />
                                {tone.label}
                            </span>
                        </div>

                        {/* Skipped Question */}
                        {userAnswer === "Skipped" ? (
                            <div className="px-5 py-4">
                                <p className="inline-flex items-center gap-2 text-[13px] font-bold text-[#9a5a0a] bg-[#fff0d2] border border-[#9a5a0a]/20 px-3 py-1.5 rounded-full mb-3">
                                    <Lightbulb className="w-4 h-4" />
                                    You skipped this question — review the model answer
                                </p>
                                <div className="rounded-xl bg-[#f7fafb] p-4 border border-[#dde5ec]">
                                    <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#5a6d80] mb-2">Ideal Answer</p>
                                    <div className="prose max-w-full break-words overflow-x-auto text-[14px]">
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                            {cleanedFeedback || "Ideal answer not available."}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="px-5 py-4 grid gap-3">
                                {/* User's Answer */}
                                <div className="rounded-xl border border-[#dde5ec] bg-[#f7fafb] p-4">
                                    <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase text-[#5a6d80] mb-1.5">
                                        <MessageSquareText className="w-4 h-4" />
                                        Your Answer
                                    </p>
                                    <p className="text-[14px] leading-relaxed text-[#0f1e2e]">{userAnswer || "No answer recorded"}</p>
                                </div>

                                {/* Feedback */}
                                <div className="rounded-xl border border-[#0f766e]/20 bg-[#f0faf8] p-4">
                                    <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase text-[#0f766e] mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Coach feedback
                                    </p>
                                    <div className="text-[#33475e] prose max-w-full break-words overflow-x-auto text-[14px]">
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                            {feedback || "No feedback available."}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
}
