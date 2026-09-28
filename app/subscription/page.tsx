'use client'
import React, { useState } from 'react';
import { Check, X, Star, Zap, Crown, Menu, ArrowRight, Users, Brain, FileText, Search, BarChart3, Bot, Shield, Award, Clock, User, HandHeartIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function SubscriptionPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('pro');
    const [isAnnual, setIsAnnual] = useState(false);

    const plans = [
        {
            name: 'Free',
            price: { monthly: 0, annual: 0 },
            description: 'Perfect for getting started with interview preparation',
            icon: Users,
            color: 'bg-[#d9efea] text-[#0b5d57]',
            buttonColor: 'teal',
            borderColor: 'border-[#dde5ec]',
            features: [
                { name: 'Mock Interviews', value: '3 sessions per month', included: true },
                { name: 'Interview History', value: 'Last 30 days only', included: true },
                { name: 'Basic Analysis', value: 'Performance scores', included: true },
                { name: 'ATS Resume Scan', value: '2 scans per month', included: true },
                { name: 'Resume Builder', value: 'Basic templates', included: false },
                { name: 'Job Search AI', value: 'Advanced matching', included: false },
                { name: 'AI Agents', value: 'Premium automation', included: false },
                { name: 'Priority Support', value: '24/7 dedicated support', included: false }
            ]
        },
        {
            name: 'Pro',
            price: { monthly: 29, annual: 290 },
            description: 'Most popular choice for serious job seekers',
            icon: Zap,
            color: 'bg-white/10 text-white',
            buttonColor: 'coral',
            borderColor: 'border-white/10',
            popular: true,
            features: [
                { name: 'Mock Interviews', value: 'Unlimited sessions', included: true },
                { name: 'Interview History', value: 'Complete history & analytics', included: true },
                { name: 'Advanced Analysis', value: 'AI-powered insights & feedback', included: true },
                { name: 'ATS Resume Scan', value: '50 scans per day', included: true },
                { name: 'Resume Builder', value: 'Premium templates & optimization', included: true },
                { name: 'Job Search AI', value: 'Smart matching & recommendations', included: true },
                { name: 'AI Agents', value: 'Basic automation features', included: false },
                { name: 'Priority Support', value: 'Email & chat support', included: false }
            ]
        },
        {
            name: 'Enterprise',
            price: { monthly: 99, annual: 990 },
            description: 'Advanced features for teams and professionals',
            icon: Crown,
            color: 'bg-[#e3e8ff] text-[#2e4bff]',
            buttonColor: 'teal',
            borderColor: 'border-[#dde5ec]',
            features: [
                { name: 'Mock Interviews', value: 'Unlimited + custom scenarios', included: true },
                { name: 'Interview History', value: 'Advanced analytics & reporting', included: true },
                { name: 'AI Analysis', value: 'Deep learning insights & coaching', included: true },
                { name: 'ATS Resume Scan', value: 'Unlimited + API access', included: true },
                { name: 'Resume Builder', value: 'All templates + custom branding', included: true },
                { name: 'Job Search AI', value: 'Advanced AI agents & automation', included: true },
                { name: 'AI Agents', value: 'Full automation suite', included: true },
                { name: 'Priority Support', value: '24/7 phone, chat & dedicated manager', included: true }
            ]
        }
    ];

    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Mock Interviews',
            description: 'Practice with realistic scenarios using advanced AI technology tailored to your industry and role.'
        },
        {
            icon: BarChart3,
            title: 'Comprehensive Performance Analysis',
            description: 'Receive detailed insights on communication skills, confidence levels, and technical competencies.'
        },
        {
            icon: FileText,
            title: 'ATS-Optimized Resume Builder',
            description: 'Create professional resumes that successfully pass Applicant Tracking Systems.'
        },
        {
            icon: Search,
            title: 'Intelligent Job Matching',
            description: 'Discover opportunities that align perfectly with your skills, experience, and career goals.'
        },
        {
            icon: Bot,
            title: 'AI-Powered Automation',
            description: 'Streamline applications and follow-ups with intelligent automation agents.'
        },
        {
            icon: Shield,
            title: 'Enterprise Security',
            description: 'Your data is protected with enterprise-grade security and privacy measures.'
        }
    ];

    const testimonials = [
        {
            name: 'Harsh Tiwari',
            role: 'Software Engineer',
            company: 'Absyz',
            content: 'Interview Pro helped me land my dream job at a top tech company. The AI feedback was incredibly accurate.',
            rating: 4
        },
        {
            name: 'Govind Kushwaha',
            role: 'Project Lead',
            company: 'StartupXYZ',
            content: 'The mock interviews were so realistic, I felt completely prepared for the real thing.',
            rating: 5
        },

    ];

    const getPlanButtonClass = (planName: string, isPopular?: boolean) => {
        if (isPopular) {
            return "bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] text-white shadow-[0_8px_20px_rgba(217,85,43,0.30)] hover:shadow-[0_10px_24px_rgba(217,85,43,0.36)] hover:-translate-y-px";
        }
        return "bg-[#0f766e] text-white shadow-[0_6px_16px_rgba(15,118,110,0.25)] hover:bg-[#0b5d57] hover:-translate-y-px";
    };

    return (
        <div className="flex h-dvh overflow-hidden bg-[#e2e8ef] text-[#0f1e2e]">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#0f1e2e]/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            {/* Main Content — elevated sheet floating above the recessed sidebar */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative z-20 bg-white border border-[#dde5ec] shadow-[0_24px_64px_rgba(15,30,46,0.18),-16px_0_40px_rgba(15,30,46,0.10)] lg:rounded-[24px] lg:my-4 lg:mr-4 lg:ml-3">
                {/* Header */}
                <header className="shrink-0 bg-white/80 backdrop-blur-xl border-b border-[#dde5ec]">
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3 sm:space-x-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open sidebar"
                                className="lg:hidden p-2 rounded-[10px] text-[#5a6d80] hover:text-[#0f1e2e] hover:bg-[#f0f4f7] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="font-display text-base sm:text-xl font-bold text-[#0f1e2e]" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Subscription Plans</h1>
                                <p className="hidden sm:block text-[#5a6d80] text-xs sm:text-sm">Choose the plan that best fits your career goals</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center px-4 py-2 rounded-[10px] bg-[#0f1e2e] text-white text-sm font-semibold shadow-[0_4px_12px_rgba(15,30,46,0.18)] transition-all duration-200 hover:bg-[#172b43] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]">
                            Dashboard
                        </button>

                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f3f6f8] p-4 sm:p-6 lg:p-8">
                    {/* Hero Section */}
                    <div className="text-center mb-12 sm:mb-16">

                        <div className="inline-flex items-center bg-[#d9efea] border border-[#dde5ec] text-[#0b5d57] px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                            <Award size={14} className="mr-2 sm:mr-2" aria-hidden="true" />
                            Trusted by 10,000+ professionals
                        </div>

                        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0f1e2e] mb-4 sm:mb-6 leading-tight tracking-tight" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>
                            Choose Your
                            <span className="text-[#0f766e]"> Success Plan</span>
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-[#5a6d80] mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                            Transform your interview performance with AI-powered practice, personalized feedback, and professional guidance
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center mb-8 sm:mb-12">
                            <div className="bg-[#f0f4f7] border border-[#dde5ec] rounded-full p-1.5 shadow-[0_2px_8px_rgba(15,30,46,0.05)]">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setIsAnnual(false)}
                                        aria-pressed={!isAnnual}
                                        className={`px-4 sm:px-5 py-2 text-xs sm:text-sm rounded-full font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${!isAnnual ? 'bg-[#0f1e2e] text-white shadow-[0_2px_8px_rgba(15,30,46,0.18)]' : 'text-[#5a6d80] hover:text-[#0f1e2e]'}`}>
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setIsAnnual(!isAnnual)}
                                        aria-label="Toggle annual billing"
                                        aria-pressed={isAnnual}
                                        className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full border border-[#dde5ec] transition-colors duration-200 mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${isAnnual ? 'bg-[#0f766e]' : 'bg-[#dde5ec]'}`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform duration-200 shadow-[0_2px_6px_rgba(15,30,46,0.2)] ${isAnnual ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`}
                                        />
                                    </button>
                                    <button
                                        onClick={() => setIsAnnual(true)}
                                        aria-pressed={isAnnual}
                                        className={`px-4 sm:px-5 py-2 text-xs sm:text-sm rounded-full font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${isAnnual ? 'bg-[#0f1e2e] text-white shadow-[0_2px_8px_rgba(15,30,46,0.18)]' : 'text-[#5a6d80] hover:text-[#0f1e2e]'}`}>
                                        Annual
                                    </button>
                                    <span className="ml-2 text-xs sm:text-sm bg-[#dff5e3] text-[#15803d] px-2 sm:px-3 py-1 rounded-full font-semibold border border-[#dde5ec]">
                                        Save 17%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20 items-stretch">
                        {plans.map((plan, index) => {
                            const isPopular = (plan as { popular?: boolean }).popular;
                            return (
                            <div
                                key={plan.name}
                                className={`relative rounded-[24px] overflow-hidden border transition-all duration-200 hover:-translate-y-1 ${isPopular ? 'bg-[#0f1e2e] border-[#0f1e2e] text-white shadow-[0_16px_40px_rgba(15,30,46,0.28)] ring-2 ring-[#ff6a3d]/40' : 'bg-white border-[#dde5ec] text-[#0f1e2e] shadow-[0_12px_32px_rgba(15,30,46,0.08)]'}`}
                            >
                                {isPopular && (
                                    <div className="bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] text-white text-center py-2 sm:py-2.5 text-sm md:text-base font-semibold">
                                        <Star className="inline mr-1 sm:mr-2" size={18} aria-hidden="true" />
                                        Most Popular Choice
                                    </div>
                                )}

                                <div className="p-6 sm:p-8 pt-8 sm:pt-8">
                                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                                        <div className={`p-3 sm:p-4 rounded-[18px] ${plan.color}`}>
                                            <plan.icon size={24} className="sm:w-7 sm:h-7" aria-hidden="true" />
                                        </div>
                                        {isPopular && (
                                            <div className="bg-[#ff6a3d]/15 border border-[#ff6a3d]/30 text-[#ffb59d] px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                                Recommended
                                            </div>
                                        )}
                                    </div>

                                    <h3 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 font-display ${isPopular ? 'text-white' : 'text-[#0f1e2e]'}`} style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>{plan.name}</h3>
                                    <p className={`text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed ${isPopular ? 'text-white/70' : 'text-[#5a6d80]'}`}>{plan.description}</p>

                                    <div className="mb-6 sm:mb-8">
                                        <div className="flex items-baseline">
                                            <span className={`text-4xl sm:text-5xl font-bold ${isPopular ? 'text-white' : 'text-[#0f1e2e]'}`}>
                                                ${isAnnual ? plan.price.annual : plan.price.monthly}
                                            </span>
                                            <span className={`text-sm sm:text-base ml-2 ${isPopular ? 'text-white/60' : 'text-[#5a6d80]'}`}>
                                                {plan.price.monthly > 0 ? (isAnnual ? '/year' : '/month') : ''}
                                            </span>
                                        </div>
                                        {isAnnual && plan.price.monthly > 0 && (
                                            <div className={`text-xs sm:text-sm mt-2 ${isPopular ? 'text-white/60' : 'text-[#5a6d80]'}`}>
                                                ${Math.round(plan.price.annual / 12)}/month when billed annually
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-[14px] font-semibold text-base sm:text-lg transition-all duration-200 ${getPlanButtonClass(plan.name, isPopular)} flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${isPopular ? 'focus-visible:ring-offset-[#0f1e2e]' : 'focus-visible:ring-offset-white'} ${selectedPlan === plan.name.toLowerCase() ? 'ring-2 ring-[#0f766e] ring-offset-2' : ''}`}
                                        onClick={() => setSelectedPlan(plan.name.toLowerCase())}
                                        aria-pressed={selectedPlan === plan.name.toLowerCase()}
                                    >
                                        {plan.name === 'Free' ? 'Start Free Trial' : `${plan.name} Plan`}
                                        <ArrowRight className="ml-2" size={18} aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                                    <div className={`border-t pt-4 sm:pt-6 ${isPopular ? 'border-white/10' : 'border-[#dde5ec]'}`}>
                                        <h4 className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${isPopular ? 'text-white' : 'text-[#0f1e2e]'}`}>What&apos;s included:</h4>
                                        <ul className="space-y-3 sm:space-y-4">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {feature.included ? (
                                                            <div className={`p-1 rounded-full border ${isPopular ? 'bg-[#0f766e] border-[#0f766e]' : 'bg-[#dff5e3] border-[#dde5ec]'}`}>
                                                                <Check className={isPopular ? "text-white" : "text-[#15803d]"} size={16} aria-hidden="true" />
                                                            </div>
                                                        ) : (
                                                            <div className={`p-1 rounded-full border ${isPopular ? 'bg-white/10 border-white/15' : 'bg-[#f0f4f7] border-[#dde5ec]'}`}>
                                                                <X className={isPopular ? "text-white/50" : "text-[#8ca0b3]"} size={16} aria-hidden="true" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-3 sm:ml-4">
                                                        <span className={`font-medium text-sm sm:text-base ${feature.included ? (isPopular ? 'text-white' : 'text-[#0f1e2e]') : (isPopular ? 'text-white/45' : 'text-[#8ca0b3]')}`}>
                                                            {feature.name}
                                                        </span>
                                                        <div className={`text-xs sm:text-sm mt-0.5 ${isPopular ? 'text-white/60' : 'text-[#5a6d80]'}`}>{feature.value}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    {/* Features Section */}
                    <div className="bg-white border border-[#dde5ec] shadow-[0_12px_32px_rgba(15,30,46,0.08)] rounded-[24px] p-8 sm:p-12 mb-12 sm:mb-16">
                        <div className="text-center mb-8 sm:mb-12">
                            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0f1e2e] mb-3 sm:mb-4" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Why Choose Interview Pro?</h3>
                            <p className="text-sm sm:text-lg text-[#5a6d80] max-w-2xl mx-auto">
                                Our platform combines cutting-edge AI technology with proven interview strategies to give you the competitive edge
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="text-center group">
                                    <div className="bg-[#d9efea] text-[#0b5d57] border border-[#dde5ec] p-4 sm:p-5 rounded-[18px] inline-block mb-4 sm:mb-5 group-hover:scale-105 transition-transform duration-200">
                                        <feature.icon size={28} className="sm:w-8 sm:h-8" aria-hidden="true" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-[#0f1e2e] mb-2 sm:mb-3">{feature.title}</h4>
                                    <p className="text-sm sm:text-base text-[#5a6d80] leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="bg-white border border-[#dde5ec] shadow-[0_12px_32px_rgba(15,30,46,0.08)] rounded-[24px] p-8 sm:p-12 mb-12 sm:mb-16">
                        <div className="text-center mb-8 sm:mb-12">
                            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0f1e2e] mb-3 sm:mb-4" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>
                                Trusted by Professionals Worldwide
                            </h3>
                            <div className="flex justify-center mb-8 sm:mb-6">
                                <div className="inline-flex flex-row bg-[#f7fafb] border border-[#dde5ec] rounded-[18px] px-2 md:px-6 py-3 sm:py-4">
                                    <div className="text-center px-4">
                                        <div className="text-2xl sm:text-3xl font-bold text-[#0f766e]">95%</div>
                                        <div className="text-xs sm:text-sm text-[#5a6d80]">Success Rate</div>
                                    </div>
                                    <div className="text-center px-4 border-x border-[#dde5ec]">
                                        <div className="text-2xl sm:text-3xl font-bold text-[#0f766e]">10K+</div>
                                        <div className="text-xs sm:text-sm text-[#5a6d80]">Happy Users</div>
                                    </div>
                                    <div className="text-center px-4">
                                        <div className="text-2xl sm:text-3xl font-bold text-[#0f766e]">500+</div>
                                        <div className="text-xs sm:text-sm text-[#5a6d80]">Companies</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="bg-[#f7fafb] border border-[#dde5ec] rounded-[18px] p-4 sm:p-6 shadow-[0_4px_12px_rgba(15,30,46,0.05)]">
                                    <div className="flex items-center mb-3 sm:mb-4" aria-label={`Rated ${testimonial.rating} out of 5`}>
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="text-[#ff6a3d] fill-current" size={14} aria-hidden="true" />
                                        ))}
                                    </div>
                                    <p className="text-sm sm:text-base text-[#0f1e2e]/80 mb-3 sm:mb-4 italic">&quot;{testimonial.content}&quot;</p>
                                    <div>
                                        <div className="font-semibold text-sm sm:text-base text-[#0f1e2e]">{testimonial.name}</div>
                                        <div className="text-xs sm:text-sm text-[#0f766e]">{testimonial.role} at {testimonial.company}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="text-center bg-[#0f1e2e] border border-white/10 rounded-[24px] p-8 sm:p-12 shadow-[0_16px_40px_rgba(15,30,46,0.28)]">
                        <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" }}>Ready to Transform Your Career?</h3>
                        <p className="text-base sm:text-xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
                            Join thousands of professionals who&apos;ve accelerated their careers with Interview Pro. Start your journey today with a free trial.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] text-white font-semibold shadow-[0_8px_20px_rgba(217,85,43,0.35)] px-6 sm:px-8 py-3 sm:py-4 rounded-[14px] text-base sm:text-lg hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(217,85,43,0.4)] transition-all duration-200 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1e2e]">
                                <Clock className="mr-2" size={18} aria-hidden="true" />
                                Start Free Trial
                            </button>
                            <button className="bg-white/10 border border-white/15 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-[14px] text-base sm:text-lg hover:bg-white/15 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                                View Demo
                            </button>
                        </div>
                        <p className="text-xs sm:text-sm text-white/50 mt-3 sm:mt-4">No credit card required • Cancel anytime</p>
                    </div>
                </main>
            </div>
        </div>
    )
}
