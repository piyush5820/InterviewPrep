"use client";
import { useState } from "react";
import { Sparkles, ArrowRight, Star, Target, Brain, Award, MessageSquare, Menu, Shield, Clock, Play, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvide";
import Image from "next/image";
import logo from "@/public/logo.png";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigation = (path: string) => {
    setIsSidebarOpen(false);
    router.push(path);
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Questions",
      description: "Get intelligent, role-specific questions tailored to your job profile and experience level."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Personalized Content",
      description: "Questions adapt to your experience level, from fresher to senior positions."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Quick Generation",
      description: "Generate comprehensive interview questions in seconds, not hours."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Industry Standards",
      description: "Questions based on current industry practices and hiring trends."
    }
  ];

  const stats = [
    { number: "10K+", label: "Questions Generated" },
    { number: "500+", label: "Job Profiles" },
    { number: "95%", label: "Success Rate" },
    { number: "24/7", label: "Available" }
  ];

  const testimonials = [
    {
      name: "Anmol",
      role: "Software Engineer",
      company: "Tech Corp",
      text: "The questions were spot-on for my frontend developer interview. Helped me prepare thoroughly!",
      rating: 5
    },
    {
      name: "Sahil",
      role: "Data Analyst",
      company: "Analytics Inc",
      text: "Amazing tool! The AI generated questions that were exactly what I faced in my actual interview.",
      rating: 5
    },
    {
      name: "Manilal",
      role: "Cloud Engineer",
      company: "Startup XYZ",
      text: "Level-appropriate questions that boosted my confidence. Highly recommend for interview prep!",
      rating: 4
    },
    {
      name: "Dipanshu",
      role: "Project Lead",
      company: "InnovateTech",
      text: "Comprehensive questions covering all aspects of product management. Excellent preparation tool!",
      rating: 5
    }
  ];

  const duplicatedTestimonials = [...testimonials, ...testimonials];

  const clearAndGo = (path: string) => {
    localStorage.removeItem("questions");
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("feedbacks");
    localStorage.removeItem("scores");
    localStorage.removeItem("interviewRole");
    localStorage.removeItem("interviewType");
    localStorage.removeItem("skills");
    localStorage.removeItem("currentQuestionIndex");
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f8] text-[#0f1e2e] overflow-x-clip">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0f1e2e]/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="md:hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </div>


      {/* Navigation */}
      <header className="sticky top-3 z-30 px-3 sm:px-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between rounded-2xl border border-[#dde5ec] bg-white/85 backdrop-blur-xl px-3 sm:px-4 py-2.5 shadow-[0_8px_28px_rgba(15,30,46,0.08)]" aria-label="Landing">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#2e4bff] p-[2px] block">
              <span className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                <Image src={logo} alt="JobFlow AI Logo" width={28} height={28} className="rounded-md" />
              </span>
            </span>
            <span className="leading-tight">
              <span className="block text-[17px] font-bold font-display tracking-tight">
                PreplystHub
              </span>
              <span className="block text-[11px] font-semibold tracking-[0.16em] uppercase text-[#0f766e]">
                AI interview studio
              </span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => handleNavigation("/history")}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-[#33475e] border border-[#dde5ec] bg-white hover:border-[#0f766e]/40 hover:bg-[#f0faf8] btn-transition"
            >
              View History
            </button>
            <button
              onClick={() => {
                // Clear stale data first
                localStorage.removeItem("questions");
                localStorage.removeItem("userAnswers");
                localStorage.removeItem("feedbacks");
                localStorage.removeItem("scores");
                localStorage.removeItem("interviewRole");
                localStorage.removeItem("interviewType");
                localStorage.removeItem("skills");
                localStorage.removeItem("currentQuestionIndex");
                router.push("/dashboard");
              }}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-[#0f1e2e] hover:bg-[#172b43] shadow-[0_8px_20px_rgba(15,30,46,0.22)] btn-transition"
            >
              Dashboard
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2.5 rounded-xl border border-[#dde5ec] bg-white hover:bg-[#f0f4f7] btn-transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-10 overflow-hidden">
        {/* Ambient backdrop — soft orbs plus traverse-loop blur balls */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="ambient-orb w-[520px] h-[520px] left-[-120px] top-[-80px] bg-[#0f766e]/25" />
          <div className="ambient-orb w-[460px] h-[460px] right-[-100px] top-[20px] bg-[#2e4bff]/20" style={{ animationDelay: "-5s" }} />
          <div className="ambient-orb w-[380px] h-[380px] left-[38%] bottom-[-160px] bg-[#ff6a3d]/18" style={{ animationDelay: "-2.5s" }} />
          <div className="traverse-ball top-[10%] h-[300px] w-[300px] bg-[#0f766e]/35" style={{ animationDuration: "17s" }} />
          <div className="traverse-ball top-[56%] h-[240px] w-[240px] bg-[#ff6a3d]/30" style={{ animationDuration: "23s", animationDelay: "-9s" }} />
        </div>
        <div className="relative max-w-4xl mx-auto text-center animate-rise">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold bg-white border border-[#dde5ec] shadow-sm text-[#0f766e] mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Interview Preparation
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6a3d]" />
            <span className="text-[#5a6d80] font-semibold">Live voice + ATS</span>
          </div>
          <h1 className="font-display text-[42px] sm:text-[60px] leading-[1.02] font-bold tracking-tight mb-5">
            Ace Your Next
            <span className="block bg-gradient-to-r from-[#0f766e] via-[#2e4bff] to-[#ff6a3d] bg-clip-text text-transparent"> Interview</span>
          </h1>
          <p className="text-[16px] sm:text-[18px] text-[#5a6d80] mb-8 max-w-2xl mx-auto leading-relaxed">
            Generate personalized interview questions tailored to your job profile and experience level.
            Prepare smarter, not harder, with our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => {
                localStorage.removeItem("questions");
                localStorage.removeItem("userAnswers");
                localStorage.removeItem("feedbacks");
                localStorage.removeItem("scores");
                localStorage.removeItem("interviewRole");
                localStorage.removeItem("interviewType");
                localStorage.removeItem("skills");
                localStorage.removeItem("currentQuestionIndex");
                router.push("/auth");
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-[14px] font-bold text-white bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] shadow-[0_12px_28px_rgba(255,106,61,0.35)] hover:brightness-[1.05] hover:-translate-y-[1px] btn-transition flex items-center justify-center gap-2"
            >
              <span>Start Preparing Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNavigation("/homeform")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-[14px] font-bold text-[#0f1e2e] bg-white border border-[#dde5ec] shadow-[0_8px_20px_rgba(15,30,46,0.08)] hover:border-[#0f766e]/40 hover:bg-[#f0faf8] btn-transition flex items-center justify-center gap-2"
            >
              <span className="w-8 h-8 rounded-full bg-[#0f1e2e] text-white flex items-center justify-center">
                <Play className="w-4 h-4 ml-[1px]" />
              </span>
              <span>Watch Demo</span>
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12px] font-semibold text-[#5a6d80]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#dde5ec]"><CheckCircle2 className="w-3.5 h-3.5 text-[#0f766e]" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#dde5ec]"><MessageSquare className="w-3.5 h-3.5 text-[#2e4bff]" /> Voice + text modes</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#dde5ec]"><Shield className="w-3.5 h-3.5 text-[#0f766e]" /> Private by design</span>
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-[#dde5ec] bg-white shadow-[0_12px_32px_rgba(15,30,46,0.08)] p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center relative">
                <div className="font-display text-[28px] font-bold text-[#0f1e2e] mb-1">{stat.number}</div>
                <div className="text-[13px] font-semibold text-[#5a6d80]">{stat.label}</div>
                {index !== stats.length - 1 && <span className="hidden md:block absolute right-[-12px] top-2 bottom-2 w-px bg-[#eef2f6]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 sm:px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#0f766e] mb-3">Why PreplystHub</p>
            <h2 className="font-display text-[30px] sm:text-[38px] font-bold tracking-tight mb-3">Why Choose PreplystHub - AI?</h2>
            <p className="text-[15px] sm:text-[17px] text-[#5a6d80] max-w-2xl mx-auto leading-relaxed">
              Our intelligent platform adapts to your needs, providing the most relevant and challenging questions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="group rounded-2xl border border-[#dde5ec] bg-white p-6 shadow-[0_6px_20px_rgba(15,30,46,0.06)] hover:shadow-[0_16px_40px_rgba(15,30,46,0.12)] hover:-translate-y-1 btn-transition">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white ${index % 2 === 0 ? "bg-gradient-to-br from-[#0f766e] to-[#0b5d57]" : "bg-gradient-to-br from-[#2e4bff] to-[#1e38d6]"}`}>
                  {feature.icon}
                </div>
                <h3 className="text-[15px] font-bold mb-2">{feature.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-[#5a6d80]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <h2 className="font-display text-[28px] sm:text-[34px] font-bold tracking-tight">Success Stories</h2>
              <p className="text-[15px] text-[#5a6d80]">See how others have succeeded with PreplystHub - AI</p>
            </div>
            <button onClick={() => clearAndGo("/auth")} className="self-start sm:self-auto inline-flex items-center gap-2 text-[13px] font-bold text-[#0f766e] hover:text-[#0b5d57]">
              Join them <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <div className="flex gap-4 animate-marquee w-max pr-4">
              {duplicatedTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl border border-[#dde5ec] bg-white p-5 shadow-[0_8px_24px_rgba(15,30,46,0.07)]"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#ff6a3d] fill-current" />
                    ))}
                    <span className="ml-auto text-[11px] font-bold text-[#5a6d80] bg-[#f0f4f7] px-2 py-1 rounded-full">Verified</span>
                  </div>
                  <p className="text-[13.5px] text-[#33475e] mb-4 italic leading-relaxed">“{testimonial.text}”</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-[#eef2f6]">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0f766e] to-[#2e4bff] text-white text-[13px] font-bold flex items-center justify-center">
                      {testimonial.name.charAt(0)}
                    </span>
                    <div>
                      <div className="text-[13px] font-bold">{testimonial.name}</div>
                      <div className="text-[12px] text-[#5a6d80]">{testimonial.role} • {testimonial.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute left-0 top-0 w-16 sm:w-24 h-full bg-gradient-to-r from-[#f3f6f8] to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 w-16 sm:w-24 h-full bg-gradient-to-l from-[#f3f6f8] to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-[28px] bg-[#0f1e2e] text-white p-8 sm:p-12 text-center shadow-[0_24px_64px_rgba(15,30,46,0.32)]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="ambient-orb w-[380px] h-[380px] left-[-80px] top-[-80px] bg-[#0f766e]/50" />
              <div className="ambient-orb w-[320px] h-[320px] right-[-60px] bottom-[-60px] bg-[#ff6a3d]/30" />
            </div>
            <div className="relative">
              <h2 className="font-display text-[30px] sm:text-[38px] font-bold tracking-tight mb-3">Ready to Ace Your Interview?</h2>
              <p className="text-[15px] sm:text-[17px] mb-7 text-white/70">
                Join thousands of successful candidates who prepared with PreplystHub - AI
              </p>
              <button
                onClick={() => handleNavigation("/homeform")}
                className="px-7 py-3.5 rounded-2xl text-[14px] font-bold text-white bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] shadow-[0_12px_28px_rgba(255,106,61,0.4)] hover:brightness-[1.06] hover:-translate-y-[1px] btn-transition inline-flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate Your Questions Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — slim brand bar */}
      <footer className="relative z-10 px-4 sm:px-6 pb-5">
        <div className="max-w-6xl mx-auto rounded-2xl border border-[#dde5ec] bg-white/90 backdrop-blur px-4 sm:px-5 py-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f766e] to-[#2e4bff] p-[1.5px] block shrink-0">
                <span className="w-full h-full rounded-[7px] bg-white flex items-center justify-center overflow-hidden">
                  <Image src={logo} alt="PreplystHub AI logo" width={22} height={22} className="rounded" />
                </span>
              </span>
              <span className="leading-tight min-w-0">
                <span className="block text-[13px] font-bold tracking-tight truncate">PreplystHub AI</span>
                <span className="block text-[11px] font-medium text-[#5a6d80] truncate">AI interview studio • practice with intent</span>
              </span>
            </div>
            <nav aria-label="Footer" className="flex items-center gap-1 text-[12px] font-semibold text-[#5a6d80] sm:ml-auto">
              <button onClick={() => handleNavigation("/dashboard")} className="px-2.5 py-1.5 rounded-lg hover:bg-[#f0f4f7] hover:text-[#0f1e2e] btn-transition">Dashboard</button>
              <button onClick={() => handleNavigation("/homeform")} className="px-2.5 py-1.5 rounded-lg hover:bg-[#f0f4f7] hover:text-[#0f1e2e] btn-transition">Mock interview</button>
              <button onClick={() => handleNavigation("/history")} className="px-2.5 py-1.5 rounded-lg hover:bg-[#f0f4f7] hover:text-[#0f1e2e] btn-transition">History</button>
            </nav>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8ca0b3] sm:border-l sm:border-[#dde5ec] sm:pl-4">
              <Shield className="w-3.5 h-3.5 text-[#0f766e] shrink-0" />
              <span className="truncate">© 2026 PreplystHub • Secure & private</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
