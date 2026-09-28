"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "@/firebase/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useToast } from "@/components/ToastProvide";
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, ShieldCheck, Mic, FileCheck } from "lucide-react";
import Image from "next/image";
import logo from "@/public/logo.png"
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";

export default function AuthPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                if (user.emailVerified) {
                    showToast("✅ Successfully signed in!", "success");
                    router.push("/dashboard");
                } else {
                    showToast("⚠️ Please verify your email before signing in.", "warning");
                    auth.signOut();
                }
            }
        });

        return () => unsubscribe();
    }, [router, showToast]);


    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError("");
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            showToast("✅ Signed in with Google!", "success");
        } catch (error: any) {
            setError(error.message);
            showToast(`❌ Google sign-in failed: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) return showToast("❌ Enter your email to reset password.", "error");

        try {
            await sendPasswordResetEmail(auth, email);
            showToast("✅ Password reset email sent.", "success");
        } catch (error: any) {
            showToast(`❌ Failed to send reset email: ${error.message}`, "error");
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isSignUp) {
                if (password.length <= 8) {
                    throw new Error("Password must be at least 8 characters long.");
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                if (userCredential.user) {
                    await updateProfile(userCredential.user, {
                        displayName: name,
                    });
                    await sendEmailVerification(userCredential.user);
                    showToast("✅Please verify your email before signing in.", "success");
                    setShowVerifyModal(true);
                }
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (!userCredential.user.emailVerified) {
                    setError("Please verify your email before signing in.");
                    showToast("❌ Please verify your email before signing in.", "error");
                    setLoading(false);
                    return;
                }
                showToast("✅ Signed in successfully!", "success");
                router.push("/dashboard");
            }
        } catch (error: any) {
            if (error.code === "auth/user-not-found") {
                setError("No account found with this email.");
                showToast("❌ No account found with this email.", "error");
            } else if (error.code === "auth/wrong-password") {
                setError("Incorrect password.");
                showToast("❌ Incorrect password.", "error");
            } else if (error.code === "auth/invalid-email") {
                setError("Invalid email format.");
                showToast("❌ Invalid email format.", "error");
            } else {
                setError(error.message);
                showToast(`❌ ${isSignUp ? "Sign-up" : "Sign-in"} failed: ${error.message}`, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const resendVerificationEmail = async () => {
        if (resendCooldown) {
            showToast("⏳ Please wait before resending.", "warning");
            return;
        }

        const user = auth.currentUser;
        if (user && !user.emailVerified) {
            try {
                await sendEmailVerification(user);
                showToast("✅ New verification email sent.", "success");
                setResendCooldown(true);
                setTimeout(() => setResendCooldown(false), 30000);
            } catch (error: any) {
                showToast(`❌ Failed to resend: ${error.message}`, "error");
            }
        } else {
            showToast("⚠️ Email is already verified. Go to Sign In page", "warning");
        }
    };



    return (
        <div className="relative min-h-screen bg-[#f3f6f8] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Traverse-loop blur balls: enter left, sink right, loop */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="traverse-ball-vivid top-[8%] h-[340px] w-[340px] bg-[#0f766e]/45" style={{ animationDuration: "20s" }} />
                <div className="traverse-ball-vivid top-[62%] h-[300px] w-[300px] bg-[#2e4bff]/40" style={{ animationDuration: "26s", animationDelay: "-12s" }} />
            </div>
            <div className="relative w-full max-w-5xl grid lg:grid-cols-2 overflow-hidden rounded-[28px] border border-[#dde5ec] bg-white shadow-[0_24px_64px_rgba(15,30,46,0.16)] animate-rise">
                {/* Brand panel */}
                <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#0f1e2e] text-white overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="ambient-orb w-[380px] h-[380px] left-[-80px] top-[-60px] bg-[#0f766e]/50" />
                        <div className="ambient-orb w-[300px] h-[300px] right-[-60px] bottom-[-40px] bg-[#2e4bff]/40" />
                        <div className="traverse-ball-vivid top-[14%] h-[220px] w-[220px] bg-[#2dd4bf]/45" style={{ animationDuration: "12s" }} />
                        <div className="traverse-ball-vivid top-[62%] h-[180px] w-[180px] bg-[#ff6a3d]/45" style={{ animationDuration: "17s", animationDelay: "-7s" }} />
                    </div>
                    <div className="relative flex items-center gap-3">
                        <Image src={logo} alt="PreplystHub" width={40} height={40} className="rounded-xl" />
                        <span className="font-display font-bold text-[17px]">PreplystHub</span>
                    </div>
                    <div className="relative">
                        <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] uppercase text-[#7be0d3] bg-white/10 border border-white/15 px-3 py-1.5 rounded-full mb-4">
                            <Sparkles className="w-3.5 h-3.5" /> Interview studio
                        </p>
                        <h1 className="font-display text-[36px] leading-[1.05] font-bold mb-3">
                            Practice like<br />it&apos;s the real<br /><span className="text-[#7be0d3]">room.</span>
                        </h1>
                        <p className="text-white/65 text-[14px] leading-relaxed max-w-[300px] mb-6">
                            Voice-led mocks, ATS feedback and role-specific questions — tuned to freshers and pros.
                        </p>
                        <div className="grid gap-2.5 text-[13px]">
                            {[
                                { icon: Mic, t: "Live voice interviewer with transcripts" },
                                { icon: FileCheck, t: "ATS scan + optimizer built-in" },
                                { icon: ShieldCheck, t: "Private — your data stays yours" },
                            ].map((r, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.07] border border-white/10 px-3.5 py-2.5">
                                    <r.icon className="w-4 h-4 text-[#7be0d3]" />
                                    <span className="font-medium text-white/85">{r.t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="relative text-[12px] text-white/45">Trusted by 10,000+ students & job seekers</p>
                </div>

                {/* Form panel */}
                <div className="p-6 sm:p-9">
                    <div className="flex items-center gap-3 mb-6 lg:hidden">
                        <Image src={logo} alt="JobFlow AI Logo" width={36} height={36} className="rounded-xl" />
                        <span className="font-display font-bold">PreplystHub</span>
                    </div>
                    <div className="mb-6">
                        <h2 className="font-display text-[26px] font-bold tracking-tight">{isSignUp ? "Create Account" : "Welcome back"}</h2>
                        <p className="text-[#5a6d80] mt-1 text-[13.5px]">{isSignUp ? "Join PreplystHub - AI to start preparing" : "Access your PreplystHub - AI account"}</p>
                    </div>

                    {error && (
                        <div className="bg-[#fde3e1] border border-[#d92d20]/25 text-[#7a271a] p-3 rounded-xl mb-4 flex items-start gap-2 animate-fadeIn text-[13px]">
                            <svg className="w-4 h-4 mt-[1px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="flex items-center text-[12px] font-bold text-[#33475e] mb-1.5">
                                    <User className="w-3.5 h-3.5 mr-1.5 text-[#0f766e]" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    required={isSignUp}
                                    className="w-full px-3.5 py-3 text-[#0f1e2e] bg-[#f7fafb] border border-[#dde5ec] rounded-xl focus:bg-white focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/15 outline-none text-[14px] btn-transition placeholder:text-[#8ca0b3]"
                                />
                            </div>
                        )}
                        <div>
                            <label className="flex items-center text-[12px] font-bold text-[#33475e] mb-1.5">
                                <Mail className="w-3.5 h-3.5 mr-1.5 text-[#0f766e]" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-3.5 py-3 text-[#0f1e2e] bg-[#f7fafb] border border-[#dde5ec] rounded-xl focus:bg-white focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/15 outline-none text-[14px] btn-transition placeholder:text-[#8ca0b3]"
                            />
                        </div>
                        <div>
                            <label className="flex items-center text-[12px] font-bold text-[#33475e] mb-1.5">
                                <Lock className="w-3.5 h-3.5 mr-1.5 text-[#0f766e]" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-3.5 py-3 text-[#0f1e2e] bg-[#f7fafb] border border-[#dde5ec] rounded-xl focus:bg-white focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/15 outline-none text-[14px] btn-transition placeholder:text-[#8ca0b3]"
                            />
                            {!isSignUp && (
                                <p className="text-[12px] text-[#5a6d80] mt-1.5">
                                    Forgot your password?
                                    <button type="button" onClick={handleForgotPassword} className="text-[#0f766e] hover:underline ml-1 font-bold">Reset it</button>
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-[#0f1e2e] text-white font-bold shadow-[0_10px_24px_rgba(15,30,46,0.24)] hover:bg-[#172b43] disabled:opacity-50 flex items-center justify-center gap-2 text-[14px] btn-transition"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#dde5ec]"></div>
                        </div>
                        <div className="relative flex justify-center text-[11px] font-bold tracking-wide uppercase">
                            <span className="px-3 bg-white text-[#8ca0b3]">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full py-3 bg-white border border-[#dde5ec] text-[#33475e] font-bold rounded-xl hover:bg-[#f7fafb] hover:border-[#c6d2dd] flex items-center justify-center gap-2 text-[14px] btn-transition disabled:opacity-60"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" /></svg>
                        <span>Sign in with Google</span>
                    </button>

                    <p className="text-center mt-5 text-[#5a6d80] text-[13px]">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(""); setEmail(""); setPassword(""); setName("");
                            }}
                            className="ml-1.5 text-[#0f766e] hover:underline font-bold"
                        >
                            {isSignUp ? "Sign In" : "Create an Account"}
                        </button>
                    </p>
                </div>
            </div>
            {showVerifyModal && (
                <div className="fixed inset-0 bg-[#0f1e2e]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white text-[#0f1e2e] rounded-2xl p-7 w-full max-w-md shadow-[0_24px_64px_rgba(15,30,46,0.3)] border border-[#dde5ec] relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0f766e] via-[#2e4bff] to-[#ff6a3d]" />
                        <div className="flex justify-center mb-5">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-[#0f1e2e] flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff6a3d] rounded-full flex items-center justify-center border-2 border-white">
                                    <span className="text-[11px] font-bold text-white">!</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="font-display text-[22px] font-bold mb-2 text-center">
                            Verify Your Email
                        </h3>

                        <div className="text-center mb-6">
                            <p className="text-[#5a6d80] text-[14px] leading-relaxed">
                                A verification email has been sent to
                            </p>
                            <div className="mt-2 px-4 py-2 bg-[#f0f4f7] border border-[#dde5ec] rounded-xl inline-block">
                                <span className="font-bold text-[13px]">{email}</span>
                            </div>
                            <p className="text-[#5a6d80] mt-2 text-[13px]">
                                Please verify your email before continuing.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    auth.signOut();
                                    setShowVerifyModal(false);
                                }}
                                className="flex-1 text-[#5a6d80] bg-[#f0f4f7] hover:bg-[#e6edf2] px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        const user = auth.currentUser;
                                        await user?.reload();
                                        if (user?.emailVerified) {
                                            showToast("✅ Email verified!", "success");
                                            setShowVerifyModal(false);
                                            router.push("/dashboard");
                                        } else {
                                            showToast("❌ Email not verified yet.", "error");
                                        }
                                    } catch (error: any) {
                                        showToast(`❌ Failed to check verification: ${error.message}`, "error");
                                    }
                                }}
                                className="flex-1 bg-gradient-to-r from-[#ff6a3d] to-[#d9552b] text-white font-bold px-4 py-3 rounded-xl text-[13px] shadow-[0_10px_24px_rgba(255,106,61,0.32)] flex items-center justify-center gap-2 hover:brightness-[1.05] btn-transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Done
                            </button>
                        </div>

                        <div className="mt-5 text-center">
                            <p className="text-[12px] font-bold text-[#d92d20] mb-1.5">
                                Didn&apos;t receive the email? Check your spam folder
                            </p>
                            <button
                                onClick={resendVerificationEmail}
                                className="text-[12px] text-[#0f766e] hover:underline font-bold"
                            >
                                Resend Verification Email
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}
