import React, { useEffect, useState } from 'react';
import { FileText, Home, History, LogIn, Users, X, TargetIcon, Briefcase, Sparkles, Zap } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import logo from '@/public/logo.png';
import { createPortal } from 'react-dom';
import { auth, signOut } from "@/firebase/firebase";
import toast from 'react-hot-toast';

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [showPremiumPopup, setShowPremiumPopup] = useState(false);
    const [userName, setUserName] = useState("");

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Signed out successfully!');
            router.push('/');
        } catch (error) {
            toast.error('Sign-out failed. Please try again.');
        }
    };

    const sidebarItems: {
        name: string;
        icon: React.FC<any>;
        path?: string;
        action?: string;
    }[] = [
            { name: 'Dashboard', icon: Home, path: '/dashboard' },
            { name: 'ATS Scan', icon: FileText, path: '/atsDashboard' },
            { name: 'Resume Optimizer', icon: Sparkles, path: '/optimize' },
            { name: 'Bullet Points', icon: Zap, path: '/optimize' },
            { name: 'Job Tracker', icon: Briefcase, path: '/jobTracker' },
            { name: 'Mock Interview', icon: Users, path: '/homeform' },
            { name: 'History', icon: History, path: '/history' },
            { name: 'Premium', icon: TargetIcon, action: 'subscription' },
            { name: 'Log Out', icon: LogIn, action: 'logout' },
        ];

    useEffect(() => {
        const user = auth?.currentUser;
        if (user) {
            setUserName(user.displayName || user.email || "User");
        } else {
            setUserName("User");
        }
    }, []);



    return (
        <>
        <div
            className={`fixed inset-y-0 left-0 z-50 w-[284px] max-w-[86vw] sm:w-[272px] lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-10 transform transition-transform duration-300 ease-out will-change-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'} lg:translate-x-0`}
        >
            <div className="flex flex-col h-[calc(100dvh-24px)] lg:h-screen m-3 lg:m-0 rounded-2xl lg:rounded-none overflow-hidden bg-[#e9edf2] text-[#0f1e2e] border-0">
                {/* Sidebar Header */}
                <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 bg-transparent">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-10 h-10 rounded-xl bg-white shadow-sm p-[2px] block shrink-0">
                                <span className="w-full h-full rounded-[10px] bg-[#0f766e] flex items-center justify-center overflow-hidden">
                                    <Image src={logo} alt="PreplystHub - AI Logo" width={26} height={26} className="rounded-md" />
                                </span>
                            </span>
                            <span className="leading-tight min-w-0">
                                <span className="block text-[14px] font-bold font-display tracking-tight truncate">PreplystHub</span>
                                <span className="block text-[10px] font-medium text-[#5a6d80] tracking-[0.14em] uppercase">AI Studio</span>
                            </span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            aria-label="Close sidebar"
                            className="p-2 rounded-lg bg-[#0f1e2e]/5 hover:bg-[#0f1e2e]/10 text-[#0f1e2e] btn-transition lg:hidden shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-3 rounded-xl bg-white/80 shadow-sm p-3 flex items-center justify-between gap-3">
                        <div className="text-[12px] leading-tight min-w-0">
                            <p className="text-[#5a6d80] font-medium truncate">Interview readiness</p>
                            <p className="text-[#0f1e2e] font-bold text-[14px]">72% prepared</p>
                        </div>
                        <div className="w-14 sm:w-16 h-2 rounded-full bg-[#0f1e2e]/10 overflow-hidden shrink-0" role="progressbar" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100} aria-label="Interview readiness">
                            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#0f766e] to-[#2e4bff]" />
                        </div>
                    </div>
                </div>

                {/* Navigation — self-scrolling only */}
                <nav className="flex-1 min-h-0 px-2.5 sm:px-3 py-3 space-y-1 overflow-y-auto overscroll-contain custom-scrollbar" aria-label="Sidebar">
                    {sidebarItems.map((item) => {
                        const isActive = item.path && pathname.startsWith(item.path);

                        return (
                            <button
                                key={item.name}
                                onClick={() => {
                                    setIsSidebarOpen(false);
                                    if (item.action === 'logout') {
                                        localStorage.clear();
                                        handleSignOut();
                                    } else if (item.action === 'subscription') {
                                        setShowPremiumPopup(true);
                                    } else if (item.path) {
                                        router.push(item.path);
                                    }
                                }}
                                aria-current={isActive ? "page" : undefined}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 sm:py-2.5 text-left rounded-xl text-[13px] sm:text-[13.5px] btn-transition border-0
                                    ${isActive
                                        ? 'bg-white text-[#0f1e2e] font-bold shadow-[0_6px_16px_rgba(15,30,46,0.16)]'
                                        : item.action === 'subscription'
                                          ? 'bg-[#ff6a3d] text-white hover:bg-[#e4552b] shadow-[0_6px_16px_rgba(255,106,61,0.35)]'
                                          : 'text-[#33475e] hover:text-[#0f1e2e] hover:bg-white/80'}
                                `}
                            >
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-[#0f766e] text-white" : "bg-[#0f1e2e]/[0.07] text-[#33475e]"}`}>
                                    <item.icon className="w-[18px] h-[18px]" />
                                </span>
                                <span className="font-semibold flex-1 truncate">{item.name}</span>
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] shrink-0" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="shrink-0 p-2.5 sm:p-3 bg-transparent">
                    <div className="rounded-xl bg-white/80 shadow-sm p-3 backdrop-blur">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-[#0f766e] text-white flex items-center justify-center text-[14px] font-bold shrink-0">
                                U
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-bold truncate">{userName}</p>
                                <p className="text-[11px] text-[#5a6d80] truncate">Free Plan • 3 mocks left</p>
                            </div>
                            <button
                                onClick={() => setShowPremiumPopup(true)}
                                className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#ff6a3d] hover:bg-[#e4552b] btn-transition"
                            >
                                Upgrade
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            {/* Premium Popup */}
            {showPremiumPopup &&
                typeof window !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 bg-[#0f1e2e]/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white rounded-2xl border border-[#dde5ec] shadow-[0_24px_64px_rgba(15,30,46,0.28)] max-w-md w-full p-6 sm:p-7 relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0f766e] via-[#2e4bff] to-[#ff6a3d]" />
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0f766e]">Premium</p>
                                    <h2 className="text-[20px] font-bold text-[#0f1e2e] font-display">Unlock the full studio</h2>
                                </div>
                                <button
                                    onClick={() => setShowPremiumPopup(false)}
                                    aria-label="Close premium dialog"
                                    className="p-2 rounded-lg text-[#5a6d80] hover:text-[#0f1e2e] hover:bg-[#f0f4f7] border border-transparent hover:border-[#dde5ec] btn-transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[14px] text-[#5a6d80] leading-relaxed mb-5">
                                Access ATS Resume Scan, Resume Builder, and Job Search with our Premium Membership.
                            </p>
                            <button
                                onClick={() => router.push('/subscription')}
                                className="w-full px-6 py-3 rounded-xl bg-[#0f766e] text-white font-bold hover:bg-[#0b5d57] btn-transition shadow-[0_10px_24px_rgba(15,118,110,0.3)]"
                            >
                                Get Premium
                            </button>
                        </div>
                    </div>,
                    document.body
                )}

        </>
    );
};

export default Sidebar;
