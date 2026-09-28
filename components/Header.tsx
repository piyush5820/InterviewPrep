"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import {
  Home, Search, Sparkles, FileText, Briefcase, Users, History,
  Menu, X, LogOut, PenTool,
} from "lucide-react";
import logo from "@/public/logo.png";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "ATS Scan", href: "/ResumeScanner", icon: Search },
  { name: "Optimize", href: "/optimize", icon: Sparkles },
  { name: "Past Scans", href: "/atsDashboard", icon: FileText },
  { name: "Job Tracker", href: "/jobTracker", icon: Briefcase },
  { name: "Mock Interview", href: "/homeform", icon: Users },
  { name: "History", href: "/history", icon: History },
  { name: "Resume Builder", href: "/resume-builder", icon: PenTool },
];

export default function Header() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out");
      router.push("/");
    } catch {
      toast.error("Sign out failed");
    }
  };

  return (
    <nav className="sticky top-3 z-50 px-3 sm:px-5" aria-label="Primary">
      <div className="max-w-[1400px] mx-auto rounded-2xl border border-[#dde5ec] bg-white/85 backdrop-blur-xl shadow-[0_8px_28px_rgba(15,30,46,0.08)]">
        <div className="flex items-center justify-between h-[64px] px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="PreplystHub home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#2e4bff] flex items-center justify-center shadow-[0_6px_18px_rgba(15,118,110,0.28)] overflow-hidden">
              <Image src={logo} alt="PreplystHub-AI" width={26} height={26} className="rounded-md" />
            </div>
            <span className="leading-none">
              <span className="block text-[15px] font-bold tracking-tight text-[#0f1e2e] font-display">
                PREPLYSTHUB
              </span>
              <span className="block text-[11px] font-medium text-[#5a6d80] tracking-wide">
                AI interview studio
              </span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-[#f0f4f7] border border-[#dde5ec]">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-lg btn-transition ${
                    active
                      ? "bg-[#0f1e2e] text-white shadow-[0_6px_16px_rgba(15,30,46,0.22)]"
                      : "text-[#33475e] hover:bg-white hover:text-[#0f1e2e] hover:shadow-sm"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 text-[13px] font-bold text-[#33475e] rounded-xl border border-[#dde5ec] bg-white hover:border-[#ffb59d] hover:bg-[#fff1e8] hover:text-[#9a3412] btn-transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">Sign out</span>
              </button>
            )}
            <Link
              href="/homeform"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-white rounded-xl bg-gradient-to-r from-[#ff6a3d] to-[#e4552b] shadow-[0_8px_20px_rgba(255,106,61,0.32)] hover:brightness-[1.05] hover:-translate-y-[1px] btn-transition"
            >
              <Sparkles className="w-4 h-4" />
              New mock
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="lg:hidden p-2.5 rounded-xl border border-[#dde5ec] bg-white text-[#0f1e2e] hover:bg-[#f0f4f7] btn-transition"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden px-3 pb-3 animate-fadeIn">
            <div className="rounded-xl border border-[#dde5ec] bg-[#f7fafb] p-2 grid gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-lg btn-transition ${
                      active
                        ? "bg-[#0f1e2e] text-white"
                        : "text-[#33475e] hover:bg-white"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-white/15" : "bg-white border border-[#dde5ec]"}`}>
                      <item.icon className="w-4 h-4" />
                    </span>
                    {item.name}
                  </Link>
                );
              })}
              {user && (
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-[#b42318] rounded-lg hover:bg-[#fde3e1] w-full btn-transition"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
