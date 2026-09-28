"use client";
import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
    BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Legend, ReferenceLine
} from 'recharts';
import {
    FileText, Briefcase, Users, Menu, Download, Filter, X, TrendingUp,
    Calendar, Award, Target, BarChart3, Activity, ChevronDown, RefreshCw,
    Eye, Maximize2, Minimize2, Mic, MessageSquare, Languages
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, getInterviewHistory, type InterviewSummary } from '@/firebase/firebase';
import { useToast } from '@/components/ToastProvide';
import { Timestamp } from 'firebase/firestore';
import Sidebar from '../../components/Sidebar';

// Define the Interview interface based on usage
interface Interview {
    id: string;
    userId: string;
    questions: string[];
    answers: { [key: number]: string };
    feedbacks: { [key: number]: string };
    scores: { [key: number]: number };
    interviewType: string;
    interviewRole: string;
    skills: string;
    createdAt: string | Timestamp;
    summary?: InterviewSummary;
}

// Define types for chart data
interface ChartData {
    label: string;
    average: number;
    maximum: number;
    minimum: number;
    count: number;
}

interface ScoreDistributionData {
    name: string;
    value: number;
    count: number;
    color: string;
}

interface SkillsRadarData {
    skill: string;
    score: number;
    fullMark: number;
}

// Define type for selectedRange
type TimeRange = 'today' | 'Last 7 Days' | 'Last 30 Days' | 'This Year';

// Utility functions with type annotations
const subDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
};

const isWithinInterval = (date: Date, interval: { start: Date; end: Date }): boolean => {
    return date >= interval.start && date <= interval.end;
};

const format = (date: Date, formatStr: string): string => {
    if (formatStr === 'HH:mm') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (formatStr === 'EEE') {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    if (formatStr === 'MMM d') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toDateString();
};



const Dashboard = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [interviewData, setInterviewData] = useState<Interview[]>([]);
    const [showPremiumPopup, setShowPremiumPopup] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedRange, setSelectedRange] = useState<TimeRange>('This Year');
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
    const [selectedChart, setSelectedChart] = useState<'area' | 'bar' | 'line' | 'composed'>('area');
    const [selectedMetric, setSelectedMetric] = useState<'average' | 'all'>('all');
    const [isChartExpanded, setIsChartExpanded] = useState<boolean>(false);
    const [animationKey, setAnimationKey] = useState<number>(0);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsDataLoading(true);
                getInterviewHistory(user.uid)
                    .then((interviews: Interview[]) => {
                        setInterviewData(interviews);
                        setIsDataLoading(false);
                    })
                    .catch((error: Error) => {
                        showToast("❌ Failed to load interview data.", "error");
                        console.error("Error loading interview data:", error);
                        setIsDataLoading(false);
                    });
            } else {
                showToast("❌ Please sign in to view your dashboard.", "error");
                router.push("/auth");
            }
            setIsAuthLoading(false);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [router, showToast]);

    const refreshData = () => {
        setAnimationKey((prev) => prev + 1);
        const user = auth.currentUser;
        if (user) {
            setIsDataLoading(true);
            getInterviewHistory(user.uid)
                .then((interviews: Interview[]) => {
                    setInterviewData(interviews);
                    setIsDataLoading(false);
                    showToast("✅ Data refreshed successfully!", "success");
                })
                .catch((error: Error) => {
                    showToast("❌ Failed to refresh data.", "error");
                    setIsDataLoading(false);
                });
        }
    };

    const getFilteredData = (interviews: Interview[], selectedRange: TimeRange): ChartData[] => {
        const now = new Date();
        let filtered: Interview[] = [];

        if (selectedRange === 'today') {
            filtered = interviews.filter((interview) => {
                const date = typeof interview.createdAt === 'string' ? new Date(interview.createdAt) : interview.createdAt.toDate();
                return isSameDay(date, now);
            });

            return filtered
                .sort((a, b) => {
                    const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt.toDate();
                    const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt.toDate();
                    return dateA.getTime() - dateB.getTime();
                })
                .map((interview) => {
                    const date = typeof interview.createdAt === 'string' ? new Date(interview.createdAt) : interview.createdAt.toDate();
                    const time = format(date, 'HH:mm');
                    const scores = Object.values(interview.scores ?? {});
                    const avgScore = interview.questions.length > 0 ? scores.reduce((a, b) => a + b, 0) / interview.questions.length : 0;
                    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
                    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
                    return {
                        label: time,
                        average: parseFloat(avgScore.toFixed(1)),
                        maximum: parseFloat(maxScore.toFixed(1)),
                        minimum: parseFloat(minScore.toFixed(1)),
                        count: 1,
                    };
                });
        } else if (selectedRange === 'Last 7 Days') {
            filtered = interviews.filter((interview) => {
                const date = typeof interview.createdAt === 'string' ? new Date(interview.createdAt) : interview.createdAt.toDate();
                return isWithinInterval(date, { start: subDays(now, 6), end: now });
            });

            const grouped: { [key: string]: Interview[] } = {};
            filtered.forEach((interview) => {
                const date = typeof interview.createdAt === 'string' ? new Date(interview.createdAt) : interview.createdAt.toDate();
                const day = format(date, 'EEE');
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(interview);
            });

            return Object.entries(grouped).map(([day, interviews]) => ({
                label: day,
                average: getAverage(interviews),
                maximum: getMaximum(interviews),
                minimum: getMinimum(interviews),
                count: interviews.length,
            }));
        } else if (selectedRange === 'Last 30 Days') {
            filtered = interviews.filter((interview) => {
                const date = typeof interview.createdAt === 'string' ? new Date(interview.createdAt) : interview.createdAt.toDate();
                return isWithinInterval(date, { start: subDays(now, 29), end: now });
            });

            const grouped: { [key: string]: Interview[] } = {};
            filtered.forEach((interview) => {
                const date = typeof interview.createdAt === 'string' ? new Date(interview.createdAt) : interview.createdAt.toDate();
                const day = format(date, 'MMM d');
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(interview);
            });

            return Object.entries(grouped).map(([day, interviews]) => ({
                label: day,
                average: getAverage(interviews),
                maximum: getMaximum(interviews),
                minimum: getMinimum(interviews),
                count: interviews.length,
            }));
        } else {
            return getMonthlyScores(interviews);
        }
    };

    const getAverage = (interviews: Interview[]): number => {
        if (interviews.length === 0) return 0;
        const sum = interviews.reduce((total, interview) => {
            const scores = Object.values(interview.scores ?? {});
            const avg = interview.questions.length > 0 ? scores.reduce((a, b) => a + b, 0) / interview.questions.length : 0;
            return total + avg;
        }, 0);
        return +(sum / interviews.length).toFixed(1);
    };

    const getMaximum = (interviews: Interview[]): number => {
        if (interviews.length === 0) return 0;
        const max = interviews.reduce((maxVal, interview) => {
            const scores = Object.values(interview.scores ?? {});
            const interviewMax = scores.length > 0 ? Math.max(...scores) : 0;
            return Math.max(maxVal, interviewMax);
        }, 0);
        return +max.toFixed(1);
    };

    const getMinimum = (interviews: Interview[]): number => {
        if (interviews.length === 0) return 0;
        const min = interviews.reduce((minVal, interview) => {
            const scores = Object.values(interview.scores ?? {});
            const interviewMin = scores.length > 0 ? Math.min(...scores) : 10;
            return Math.min(minVal, interviewMin);
        }, 10);
        return +min.toFixed(1);
    };

    const getMonthlyScores = (interviews: Interview[]): ChartData[] => {
        const currentYear = new Date().getFullYear();
        const monthNumbers = Array.from(
            new Set(
                interviews
                    .map((interview) => {
                        const date = typeof interview.createdAt === 'string'
                            ? new Date(interview.createdAt)
                            : interview.createdAt.toDate();
                        return date.getFullYear() === currentYear ? date.getMonth() : null;
                    })
                    .filter((monthNum): monthNum is number => monthNum !== null)
            )
        ).sort((a, b) => a - b);

        if (monthNumbers.length === 0) {
            monthNumbers.push(new Date().getMonth());
        }

        const monthNames = monthNumbers.map((num) =>
            new Date(currentYear, num).toLocaleString('default', { month: 'short' })
        );

        return monthNumbers.map((monthNum, idx) => {
            const monthInterviews = interviews.filter((interview) => {
                const date = typeof interview.createdAt === 'string'
                    ? new Date(interview.createdAt)
                    : interview.createdAt.toDate();
                return date.getMonth() === monthNum && date.getFullYear() === currentYear;
            });

            return {
                label: monthNames[idx],
                average: getAverage(monthInterviews),
                maximum: getMaximum(monthInterviews),
                minimum: getMinimum(monthInterviews),
                count: monthInterviews.length,
            };
        });
    };

    const getScoreDistribution = (interviews: Interview[]): ScoreDistributionData[] => {
        const grouped: { [key: string]: Interview[] } = {};
        interviews.forEach((interview) => {
            const key = interview.interviewRole; // Use only interviewRole as the key
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(interview);
        });

        const colors = [
            '#0f766e', '#2e4bff', '#ff6a3d', '#027fb7',
            '#7c5cff', '#0ea5a0', '#9a5a0a', '#5a6d80',
        ];

        return Object.entries(grouped)
            .map(([key, interviews], index) => {
                const avgScore = getAverage(interviews);
                return {
                    name: key.length > 20 ? key.substring(0, 20) + '...' : key,
                    value: avgScore,
                    count: interviews.length,
                    color: colors[index % colors.length],
                };
            })
            .filter((item) => item.value > 0);
    };

    const getSkillsRadarData = (interviews: Interview[]): SkillsRadarData[] => {
        const skillsMap: { [key: string]: { total: number; count: number } } = {};
        interviews.forEach((interview) => {
            const skills = typeof interview.skills === 'string'
                ? interview.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

            skills.forEach((skill) => {
                if (!skillsMap[skill]) {
                    skillsMap[skill] = { total: 0, count: 0 };
                }
                const scores = Object.values(interview.scores ?? {});
                const avgScore = interview.questions.length > 0 ? scores.reduce((a, b) => a + b, 0) / interview.questions.length : 0;
                skillsMap[skill].total += avgScore;
                skillsMap[skill].count += 1;
            });
        });

        return Object.entries(skillsMap)
            .map(([skill, data]) => ({
                skill: skill.length > 15 ? skill.substring(0, 15) + '...' : skill,
                score: +(data.total / data.count).toFixed(1),
                fullMark: 10,
            }))
            .slice(0, 8);
    };

    const filteredData = getFilteredData(interviewData, selectedRange);
    const scoreDistribution = getScoreDistribution(interviewData);
    const skillsRadarData = getSkillsRadarData(interviewData);

    // Delivery averages across interviews that carry a live-voice summary.
    const deliverySummaries = interviewData
        .map((interview) => interview.summary)
        .filter((summary): summary is NonNullable<Interview["summary"]> => !!summary);
    const deliveryAverage = (pick: (s: NonNullable<Interview["summary"]>) => number): number =>
        deliverySummaries.length > 0
            ? deliverySummaries.reduce((total, s) => total + pick(s), 0) / deliverySummaries.length
            : 0;

    const chartData: ChartData[] = filteredData.length > 0
        ? [{ label: 'Start', average: 0, maximum: 0, minimum: 0, count: 0 }, ...filteredData]
        : [];

    const services = [
        { title: 'ATS Scan', value: 'Scan your resume', change: 'Optimize now', icon: FileText, color: 'bg-[#d9efea]', action: 'atsscan' },
        { title: 'Resume Builder', value: 'Build resume', change: 'Create now', icon: FileText, color: 'bg-[#e3e8ff]', action: 'premium' },
        { title: 'Job Search', value: 'Find jobs', change: 'Search now', icon: Briefcase, color: 'bg-[#ffe8dd]', action: 'premium' },
        { title: 'Interview Prep', value: 'Practice now', change: 'Start prep', icon: Users, color: 'bg-[#dcf1fd]', action: 'homeform' },
    ];

    const handleServiceClick = (action: string) => {
        if (action === 'homeform') {
            localStorage.removeItem('questions');
            localStorage.removeItem('userAnswers');
            localStorage.removeItem('feedbacks');
            localStorage.removeItem('scores');
            localStorage.removeItem('currentQuestionIndex');
            localStorage.removeItem('interviewRole');
            localStorage.removeItem('interviewType');
            localStorage.removeItem('skills');
            showToast('Fill Out the Form', 'success');
            router.push('/homeform');
        }
        else if (action === 'atsscan') {
            router.push('/atsDashboard')
        } else {
            setShowPremiumPopup(true);
        }
    };

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[]; }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-[#dde5ec] px-3.5 py-3 rounded-[14px] shadow-[0_8px_24px_rgba(15,30,46,0.09)]">
                    {payload.map((entry, index) => (
                        <p key={index} className="text-[13px] font-medium text-[#0f1e2e]" style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 20, right: 30, left: 20, bottom: 20 },
        };

        switch (selectedChart) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
                                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.04} />
                            </linearGradient>
                            <linearGradient id="colorMaximum" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2e4bff" stopOpacity={0.26} />
                                <stop offset="95%" stopColor="#2e4bff" stopOpacity={0.04} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6edf2" />
                        <XAxis dataKey="label" stroke="#5a6d80" fontSize={12} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <YAxis stroke="#5a6d80" fontSize={12} domain={[0, 10]} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#5a6d80' }} />
                        <ReferenceLine y={7} stroke="#ff6a3d" strokeDasharray="5 5" label={{ value: 'Target', fontSize: 11, fill: '#d9552b' }} />
                        <Area
                            type="monotone"
                            dataKey="average"
                            stroke="#0f766e"
                            fillOpacity={1}
                            fill="url(#colorAverage)"
                            strokeWidth={3}
                        />
                        {selectedMetric === 'all' && (
                            <Area
                                type="monotone"
                                dataKey="maximum"
                                stroke="#2e4bff"
                                fillOpacity={1}
                                fill="url(#colorMaximum)"
                                strokeWidth={2}
                            />
                        )}
                    </AreaChart>
                );
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6edf2" vertical={false} />
                        <XAxis dataKey="label" stroke="#5a6d80" fontSize={12} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <YAxis stroke="#5a6d80" fontSize={12} domain={[0, 10]} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#5a6d80' }} />
                        <Bar dataKey="average" fill="#0f766e" radius={[8, 8, 0, 0]} maxBarSize={36} />
                        {selectedMetric === 'all' && (
                            <Bar dataKey="maximum" fill="#2e4bff" radius={[8, 8, 0, 0]} maxBarSize={36} />
                        )}
                    </BarChart>
                );
            case 'composed':
                return (
                    <ComposedChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6edf2" vertical={false} />
                        <XAxis dataKey="label" stroke="#5a6d80" fontSize={12} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <YAxis stroke="#5a6d80" fontSize={12} domain={[0, 10]} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#5a6d80' }} />
                        <Bar dataKey="count" fill="#2e4bff" fillOpacity={0.18} radius={[8, 8, 0, 0]} yAxisId="right" maxBarSize={36} />
                        <Line type="monotone" dataKey="average" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#5a6d80" fontSize={12} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                    </ComposedChart>
                );
            default:
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6edf2" vertical={false} />
                        <XAxis dataKey="label" stroke="#5a6d80" fontSize={12} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <YAxis stroke="#5a6d80" fontSize={12} domain={[0, 10]} tickLine={false} axisLine={{ stroke: '#dde5ec' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#5a6d80' }} />
                        <ReferenceLine y={7} stroke="#ff6a3d" strokeDasharray="5 5" label={{ value: 'Target', fontSize: 11, fill: '#d9552b' }} />
                        <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#0f766e"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
                        />
                        {selectedMetric === 'all' && (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="maximum"
                                    stroke="#2e4bff"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 3, fill: '#2e4bff', strokeWidth: 2, stroke: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="minimum"
                                    stroke="#ff6a3d"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 3, fill: '#ff6a3d', strokeWidth: 2, stroke: '#fff' }}
                                />
                            </>
                        )}
                    </LineChart>
                );
        }
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#f3f6f8] flex items-center justify-center px-4">
                <div className="bg-white border border-[#dde5ec] shadow-[0_8px_24px_rgba(15,30,46,0.09)] rounded-[24px] p-8 max-w-md w-full text-center animate-rise">
                    <div className="relative w-16 h-16 mx-auto mb-6" role="status" aria-label="Loading dashboard">
                        <div className="absolute inset-0 border-4 border-[#d9efea] border-t-[#0f766e] rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-[#e3e8ff] border-t-[#2e4bff] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}></div>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#0f1e2e] mb-2">Loading Dashboard...</h2>
                    <p className="text-[#5a6d80] text-sm">Fetching your interview insights</p>
                </div>
            </div>
        );
    }

    const serviceIconColors = ['text-[#0f766e]', 'text-[#2e4bff]', 'text-[#d9552b]', 'text-[#027fb7]'];

    return (
        <div className="flex h-dvh overflow-hidden bg-[#e2e8ef] text-[#0f1e2e]">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#0f1e2e]/45 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

            {/* Main Content — elevated sheet floating above the recessed sidebar */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative z-20 bg-white border border-[#dde5ec] shadow-[0_24px_64px_rgba(15,30,46,0.18),-16px_0_40px_rgba(15,30,46,0.10)] lg:rounded-[24px] lg:my-4 lg:mr-4 lg:ml-3">
                {/* Header */}
                <div className="shrink-0 bg-white/85 backdrop-blur-md border-b border-[#dde5ec] px-4 py-4 sm:px-6 lg:px-8 sticky top-0 z-20">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 rounded-[10px] hover:bg-[#f0f4f7] text-[#5a6d80] hover:text-[#0f1e2e] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 lg:hidden"
                                aria-label="Open sidebar"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0f1e2e] tracking-tight">
                                    Dashboard
                                </h1>
                                <p className="text-[#5a6d80] mt-0.5 text-sm truncate">Your interview performance insights</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={refreshData}
                                aria-label="Refresh dashboard data"
                                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[#0f766e] text-white text-sm font-semibold shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:bg-[#0b5d57] active:bg-[#0b5d57] disabled:opacity-60 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus-visible:ring-offset-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                            <button aria-label="Filter dashboard" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-[14px] bg-white border border-[#dde5ec] text-[#0f1e2e] text-sm font-semibold shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:border-[#0f766e]/40 hover:bg-[#f0f4f7] active:bg-[#e6edf2] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40">
                                <Filter className="w-4 h-4 text-[#5a6d80]" />
                                <span>Filter</span>
                            </button>
                            <button aria-label="Export dashboard" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-[14px] bg-white border border-[#dde5ec] text-[#0f1e2e] text-sm font-semibold shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:border-[#0f766e]/40 hover:bg-[#f0f4f7] active:bg-[#e6edf2] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40">
                                <Download className="w-4 h-4 text-[#5a6d80]" />
                                <span>Export</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content — own scroll region */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 bg-[#f3f6f8]">
                    {/* Top Section with Service Cards and Interview Table */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 mb-6 sm:mb-8">
                        {/* Service Cards - 2x2 Grid */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-5">
                                {services.map((service, index) => (
                                    <div key={index} className="group bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] hover:shadow-[0_8px_24px_rgba(15,30,46,0.09)] hover:-translate-y-0.5 p-5 sm:p-6 rounded-[18px] transition-all duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${service.color} rounded-[14px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                                                <service.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${serviceIconColors[index % serviceIconColors.length]}`} />
                                            </div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8ca0b3] bg-[#f0f4f7] border border-[#dde5ec] rounded-full px-2.5 py-1">0{index + 1}</span>
                                        </div>
                                        <h3 className="font-display font-bold text-[#0f1e2e] mb-1 text-[17px]">{service.title}</h3>
                                        <p className="text-sm text-[#5a6d80] mb-4">{service.value}</p>
                                        <button
                                            onClick={() => handleServiceClick(service.action)}
                                            aria-label={`${service.title} - ${service.change}`}
                                            className="text-sm text-[#0f766e] hover:text-[#0b5d57] font-semibold transition-all duration-200 flex items-center gap-1.5 group-hover:gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 rounded-[8px]"
                                        >
                                            <span>{service.change}</span>
                                            <span aria-hidden="true">→</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interview Details Table */}
                        <div className="lg:col-span-2 bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] p-5 sm:p-6 rounded-[18px] flex flex-col h-full">
                            <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
                                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0f1e2e] flex items-center gap-2.5">
                                    <span className="w-9 h-9 rounded-[10px] bg-[#d9efea] flex items-center justify-center shrink-0">
                                        <Activity className="w-5 h-5 text-[#0f766e]" />
                                    </span>
                                    <span>Recent Interviews</span>
                                </h3>
                                <select aria-label="Choose number of recent interviews" className="px-3 py-2 rounded-[10px] bg-white border border-[#dde5ec] text-[#33475e] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus:border-[#0f766e]/50 transition-all duration-200 cursor-pointer">
                                    <option>Last 5</option>
                                    <option>Last 10</option>
                                    <option>All</option>
                                </select>
                            </div>
                            <div className="overflow-y-auto flex-1 min-h-0 max-h-[300px] custom-scrollbar -mx-1 px-1">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#dde5ec]">
                                            <th className="text-left py-3 px-2 text-[#5a6d80] text-xs font-semibold uppercase tracking-wide sticky top-0 bg-white">Type</th>
                                            <th className="text-left py-3 px-2 text-[#5a6d80] text-xs font-semibold uppercase tracking-wide sticky top-0 bg-white">Role</th>
                                            <th className="text-left py-3 px-2 text-[#5a6d80] text-xs font-semibold uppercase tracking-wide sticky top-0 bg-white">Score</th>
                                            <th className="text-left py-3 px-2 text-[#5a6d80] text-xs font-semibold uppercase tracking-wide sticky top-0 bg-white">Skills</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {interviewData.slice(0, 10).map((interview, index) => {
                                            const scores = Object.values(interview.scores ?? {});
                                            const avgScore = interview.questions.length > 0 ? scores.reduce((a, b) => a + b, 0) / interview.questions.length : 0;
                                            const skills = typeof interview.skills === 'string'
                                                ? interview.skills.split(',').map((s) => s.trim()).filter(Boolean)
                                                : [];
                                            return (
                                                <tr key={index} className="hover:bg-[#f0f4f7]/70 transition-colors duration-200 border-b border-[#e6edf2] last:border-0">
                                                    <td className="py-3.5 px-2 font-medium">
                                                        <span className="inline-block px-2.5 py-1 bg-[#e3e8ff] text-[#2e4bff] rounded-full text-xs font-semibold whitespace-nowrap">
                                                            {interview.interviewType?.slice(0, 10) || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-2 text-[#33475e] max-w-32 truncate">
                                                        {interview.interviewRole?.slice(0, 30) || 'N/A'}
                                                    </td>
                                                    <td className="py-3.5 px-2">
                                                        <span
                                                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${avgScore >= 8
                                                                ? 'bg-[#dff5e3] text-[#15803d] border-[#15803d]/20'
                                                                : avgScore >= 6
                                                                    ? 'bg-[#fff0d2] text-[#9a5a0a] border-[#9a5a0a]/20'
                                                                    : 'bg-[#fde3e1] text-[#d92d20] border-[#d92d20]/20'
                                                                }`}
                                                        >
                                                            {avgScore.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {skills.slice(0, 2).map((skill, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-[#f0f4f7] text-[#33475e] border border-[#dde5ec] rounded-[10px] text-xs font-medium">
                                                                    {skill.slice(0, 15)}
                                                                </span>
                                                            ))}
                                                            {skills.length > 2 && (
                                                                <span className="px-2 py-1 bg-[#0f1e2e] text-white rounded-[10px] text-xs font-semibold">
                                                                    +{skills.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {interviewData.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 px-2 text-[#5a6d80] text-center text-sm">
                                                    No interviews found. Start an interview to see your performance here.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Averages (live voice interviews with a summary) */}
                    {deliverySummaries.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
                            <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] rounded-[18px] p-5 flex items-center gap-4">
                                <span className="w-11 h-11 rounded-[12px] bg-[#d9efea] flex items-center justify-center shrink-0">
                                    <Mic className="w-5 h-5 text-[#0f766e]" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8ca0b3]">Confidence</p>
                                    <p className="font-display text-xl font-bold text-[#0f1e2e]">{deliveryAverage((s) => s.confidence).toFixed(1)}<span className="text-sm font-semibold text-[#8ca0b3]">/10</span></p>
                                </div>
                            </div>
                            <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] rounded-[18px] p-5 flex items-center gap-4">
                                <span className="w-11 h-11 rounded-[12px] bg-[#e3e8ff] flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-5 h-5 text-[#2e4bff]" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8ca0b3]">Communication</p>
                                    <p className="font-display text-xl font-bold text-[#0f1e2e]">{deliveryAverage((s) => s.communication).toFixed(1)}<span className="text-sm font-semibold text-[#8ca0b3]">/10</span></p>
                                </div>
                            </div>
                            <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] rounded-[18px] p-5 flex items-center gap-4">
                                <span className="w-11 h-11 rounded-[12px] bg-[#ffe8dd] flex items-center justify-center shrink-0">
                                    <Languages className="w-5 h-5 text-[#d9552b]" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8ca0b3]">Language</p>
                                    <p className="font-display text-xl font-bold text-[#0f1e2e]">{deliveryAverage((s) => s.language).toFixed(1)}<span className="text-sm font-semibold text-[#8ca0b3]">/10</span></p>
                                </div>
                            </div>
                            <div className="bg-[#0f1e2e] border border-[#0f1e2e] shadow-[0_8px_24px_rgba(15,30,46,0.22)] rounded-[18px] p-5 flex items-center gap-4">
                                <span className="w-11 h-11 rounded-[12px] bg-white/10 flex items-center justify-center shrink-0">
                                    <Award className="w-5 h-5 text-white" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Delivery overall</p>
                                    <p className="font-display text-xl font-bold text-white">{deliveryAverage((s) => s.overall).toFixed(1)}<span className="text-sm font-semibold text-white/60">/10</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                        {/* Performance Over Time */}
                        <div className="lg:col-span-2 bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] p-5 sm:p-6 rounded-[24px]">
                            <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between mb-6">
                                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0f1e2e] flex items-center gap-2.5">
                                    <span className="w-9 h-9 rounded-[10px] bg-[#d9efea] flex items-center justify-center shrink-0">
                                        <BarChart3 className="w-5 h-5 text-[#0f766e]" />
                                    </span>
                                    <span>Performance Over Time</span>
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={selectedRange}
                                        onChange={(e) => setSelectedRange(e.target.value as TimeRange)}
                                        aria-label="Select time range"
                                        className="px-3 py-2 rounded-[10px] bg-white border border-[#dde5ec] text-[#33475e] text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus:border-[#0f766e]/50 transition-all duration-200 cursor-pointer"
                                    >
                                        <option>today</option>
                                        <option>Last 7 Days</option>
                                        <option>Last 30 Days</option>
                                        <option>This Year</option>
                                    </select>

                                    <select
                                        value={selectedChart}
                                        onChange={(e) =>
                                            setSelectedChart(e.target.value as 'area' | 'bar' | 'line' | 'composed')
                                        }
                                        aria-label="Select chart type"
                                        className="px-3 py-2 rounded-[10px] bg-white border border-[#dde5ec] text-[#33475e] text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus:border-[#0f766e]/50 transition-all duration-200 cursor-pointer"
                                    >
                                        <option value="area">Area</option>
                                        <option value="bar">Bar</option>
                                        <option value="line">Line</option>
                                        <option value="composed">Composed</option>
                                    </select>

                                    <select
                                        value={selectedMetric}
                                        onChange={(e) => setSelectedMetric(e.target.value as 'average' | 'all')}
                                        aria-label="Select metric"
                                        className="px-3 py-2 rounded-[10px] bg-white border border-[#dde5ec] text-[#33475e] text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus:border-[#0f766e]/50 transition-all duration-200 cursor-pointer"
                                    >
                                        <option value="average">Average</option>
                                        <option value="all">All Metrics</option>
                                    </select>

                                    <button
                                        onClick={() => setIsChartExpanded(!isChartExpanded)}
                                        aria-label={isChartExpanded ? 'Collapse chart' : 'Expand chart'}
                                        className="hidden md:inline-flex p-2 rounded-[10px] bg-white border border-[#dde5ec] text-[#5a6d80] hover:text-[#0f766e] hover:border-[#0f766e]/40 hover:bg-[#d9efea]/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                                    >
                                        {isChartExpanded ? (
                                            <Minimize2 className="w-4 h-4" />
                                        ) : (
                                            <Maximize2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                            </div>
                            <div className={`${isChartExpanded ? 'h-[480px] sm:h-[600px]' : 'h-[280px] sm:h-[300px]'} transition-all duration-300`}>
                                <ResponsiveContainer width="100%" height="100%" key={animationKey}>
                                    {renderChart()}
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#5a6d80] border-t border-[#e6edf2] pt-4">
                                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]"></span>Average</span>
                                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2e4bff]"></span>Maximum</span>
                                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff6a3d]"></span>Target 7.0</span>
                            </div>
                        </div>

                        {/* Score Distribution */}
                        <div className="bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] p-5 sm:p-6 rounded-[24px]">
                            <h3 className="font-display text-lg sm:text-xl font-bold text-[#0f1e2e] flex items-center gap-2.5 mb-2">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ffe8dd] flex items-center justify-center shrink-0">
                                    <Target className="w-5 h-5 text-[#d9552b]" />
                                </span>
                                <span>Score Distribution</span>
                            </h3>
                            <p className="text-[13px] text-[#5a6d80] mb-4 ml-[46px]">Average score by role</p>
                            <div className="h-[280px] sm:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={scoreDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            innerRadius={52}
                                            paddingAngle={3}
                                            strokeWidth={2}
                                            stroke="#fff"
                                            label={{ fontSize: 11, fill: '#5a6d80' }}
                                        >
                                            {scoreDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: '#5a6d80' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Skills Radar Chart */}
                    <div className="mt-5 sm:mt-6 bg-white border border-[#dde5ec] shadow-[0_1px_2px_rgba(15,30,46,0.06)] p-5 sm:p-6 rounded-[24px] relative overflow-hidden">
                        <div className="ambient-orb w-72 h-72 -top-24 -right-24 opacity-40" style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.16), transparent 70%)' }} aria-hidden="true" />
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#0f1e2e] flex items-center gap-2.5 mb-6 relative z-10">
                            <span className="w-9 h-9 rounded-[10px] bg-[#e3e8ff] flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-[#2e4bff]" />
                            </span>
                            <span>Skills Performance</span>
                            <div className="ml-auto text-[13px] text-[#5a6d80] font-body font-normal bg-[#f0f4f7] border border-[#dde5ec] rounded-full px-3 py-1">
                                Interactive Chart
                            </div>
                        </h3>

                        <div className="h-[280px] sm:h-[300px] relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={skillsRadarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                    <PolarGrid
                                        stroke="#e6edf2"
                                        strokeWidth={1}
                                        strokeOpacity={1}
                                        gridType="polygon"
                                    />
                                    <PolarGrid
                                        stroke="#dde5ec"
                                        strokeWidth={0.75}
                                        strokeOpacity={1}
                                        gridType="polygon"
                                    />

                                    <PolarAngleAxis
                                        dataKey="skill"
                                        stroke="#33475e"
                                        fontSize={12}
                                        fontWeight="500"
                                        tick={{ fill: '#33475e', fontSize: 12 }}
                                        tickSize={8}
                                    />

                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 10]}
                                        stroke="#5a6d80"
                                        fontSize={11}
                                        tick={{ fill: '#8ca0b3', fontSize: 11 }}
                                        tickCount={6}
                                        tickSize={4}
                                        axisLine={false}
                                    />

                                    <Radar
                                        name="Skills"
                                        dataKey="score"
                                        stroke="#0f766e"
                                        strokeWidth={3}
                                        fill="url(#radarGradient)"
                                        fillOpacity={0.32}
                                        dot={{ fill: '#0f766e', strokeWidth: 2, stroke: '#fff', r: 4 }}
                                        activeDot={{
                                            fill: '#0b5d57',
                                            stroke: '#FFFFFF',
                                            strokeWidth: 2,
                                            r: 6,
                                        }}
                                    />

                                    <Radar
                                        name="Baseline"
                                        dataKey="score"
                                        stroke="#5a6d80"
                                        strokeWidth={1}
                                        strokeOpacity={0.35}
                                        fill="none"
                                        strokeDasharray="5,5"
                                    />

                                    <Tooltip
                                        content={<CustomTooltip />}
                                        wrapperStyle={{
                                            filter: 'drop-shadow(0 4px 12px rgba(15, 30, 46, 0.12))',
                                            zIndex: 1000
                                        }}
                                    />

                                    <defs>
                                        <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#0f766e" stopOpacity={0.42} />
                                            <stop offset="55%" stopColor="#0f766e" stopOpacity={0.18} />
                                            <stop offset="100%" stopColor="#0f766e" stopOpacity={0.05} />
                                        </radialGradient>
                                    </defs>
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Performance indicators */}
                        <div className="mt-4 flex flex-wrap justify-between items-center gap-2 text-xs text-[#5a6d80] relative z-10 border-t border-[#e6edf2] pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#0f766e] rounded-full animate-pulse"></div>
                                <span>Current Performance</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span>Scale: 0-10</span>
                                <div className="flex items-center gap-1" aria-hidden="true">
                                    <div className="w-1.5 h-1.5 bg-[#dde5ec] rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-[#8ca0b3] rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-[#0f766e] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Premium Popup  */}
            {
                showPremiumPopup && (
                    <div className="fixed inset-0 bg-[#0f1e2e]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white border border-[#dde5ec] shadow-[0_18px_48px_rgba(15,30,46,0.14)] rounded-[24px] p-6 sm:p-7 max-w-md w-full animate-rise">
                            <div className="flex items-center justify-between mb-4 gap-3">
                                <h2 className="font-display text-xl font-bold text-[#0f1e2e]">Unlock Premium Features</h2>
                                <button
                                    onClick={() => setShowPremiumPopup(false)}
                                    aria-label="Close premium popup"
                                    className="text-[#5a6d80] hover:text-[#0f1e2e] hover:bg-[#f0f4f7] transition-all duration-200 p-2 rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[#5a6d80] text-sm leading-relaxed mb-5">
                                Upgrade to Pro or Enterprise Plan to access advanced features like ATS Scan, Resume Builder, and Job Search.
                            </p>
                            <a
                                href="/subscription"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-[#0f766e] text-white font-semibold rounded-[14px] hover:bg-[#0b5d57] active:bg-[#0b5d57] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 focus-visible:ring-offset-2"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
