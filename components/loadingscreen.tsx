"use client";
import React from 'react';
import Image from 'next/image';

const LoadingScreen = ({ isLoading }: { isLoading: boolean }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1e2e] text-white overflow-hidden">
            {/* ambient background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="ambient-orb w-[420px] h-[420px] left-[8%] top-[12%] bg-[#0f766e]/40" />
                <div className="ambient-orb w-[360px] h-[360px] right-[10%] bottom-[10%] bg-[#2e4bff]/30" style={{ animationDelay: "-4s" }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
            </div>

            {/* Logo */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-6">
                <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl" />
                <Image
                    src="/loading.png"
                    alt="Loading"
                    fill
                    className="object-contain animate-pulse relative rounded-3xl"
                    priority
                />
            </div>

            <div className="relative flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-[13px] font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-pulse" />
                Preparing your studio
            </div>

            {/* Running Text */}
            <div className="relative overflow-hidden w-full max-w-md mt-4 text-center">
                <div className="text-lg sm:text-xl font-semibold font-display text-white whitespace-nowrap animate-marquee">
                    Just a moment — tuning questions to your profile …
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
