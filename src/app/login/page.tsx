"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck, KeyRound, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Code must be 6 digits"),
});

type LoginValues = z.infer<typeof loginSchema>;
type OtpValues   = z.infer<typeof otpSchema>;

// ─── Input style ──────────────────────────────────────────────────────────────

const inputCls = "w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner";

// ─── Page ─────────────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pendingCredentials, setPendingCredentials] = useState<LoginValues | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const justVerified   = searchParams.get("verified") === "true";
  const justRegistered = searchParams.get("registered") === "true";

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const otpForm   = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });

  const handleResend = async () => {
    setResending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    setResending(false); setResent(true);
  };

  // ── Step 1: email + password ──────────────────────────────────────────────
  const onSubmitCredentials = async (data: LoginValues) => {
    setLoading(true); setErrorMsg(""); setUnverifiedEmail("");
    const res = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);

    if (res?.error === "REQUIRES_2FA") {
      setPendingCredentials(data);
      setStep("otp");
    } else if (res?.error === "EMAIL_NOT_VERIFIED") {
      setUnverifiedEmail(data.email);
    } else if (res?.error) {
      setErrorMsg("Incorrect email or password.");
    } else {
      router.push("/dashboard"); router.refresh();
    }
  };

  // ── Step 2: OTP verification ───────────────────────────────────────────────
  const onSubmitOtp = async (data: OtpValues) => {
    if (!pendingCredentials) return;
    setLoading(true); setErrorMsg("");
    const res = await signIn("credentials", {
      ...pendingCredentials,
      otp: data.otp,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error === "REQUIRES_2FA" ? "2FA code required." : res.error);
    } else {
      router.push("/dashboard"); router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-neutral-950 text-neutral-200 font-sans">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 relative bg-neutral-900 overflow-hidden items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <ShieldCheck className="w-24 h-24 text-indigo-500 mb-8 mx-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
              MRA Project <br /> Management
            </h1>
            <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
              Premium operational management and IT governance platform for enterprise business efficiency.
            </p>
          </motion.div>
        </div>
        <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-sm pointer-events-none" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-24 relative z-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Credentials ── */}
            {step === "credentials" && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                  <p className="text-neutral-400 mt-2">Sign in to your MRA account to continue</p>
                </div>

                <form onSubmit={loginForm.handleSubmit(onSubmitCredentials)} className="space-y-6">
                  {/* Email verified */}
                  {justVerified && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      Email verified successfully! You can now sign in.
                    </motion.div>
                  )}

                  {/* Just registered */}
                  {justRegistered && !justVerified && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      Account created! Check your email for the verification link.
                    </motion.div>
                  )}

                  {/* Email not verified */}
                  {unverifiedEmail && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span>Email not verified. Check inbox for <strong>{unverifiedEmail}</strong></span>
                      </div>
                      {resent ? (
                        <p className="text-emerald-400 text-xs pl-6">✓ Verification email resent!</p>
                      ) : (
                        <button type="button" onClick={handleResend} disabled={resending}
                          className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors pl-6 disabled:opacity-60">
                          <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                          {resending ? "Sending..." : "Resend verification email"}
                        </button>
                      )}
                    </motion.div>
                  )}

                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-neutral-300">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                        <input {...loginForm.register("email")} type="email" placeholder="admin@mra.com" className={inputCls} />
                      </div>
                      {loginForm.formState.errors.email && <p className="text-red-400 text-xs font-medium">{loginForm.formState.errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-neutral-300">Password</label>
                        <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Forgot password?</Link>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                        <input {...loginForm.register("password")} type="password" placeholder="••••••••" className={inputCls} />
                      </div>
                      {loginForm.formState.errors.password && <p className="text-red-400 text-xs font-medium">{loginForm.formState.errors.password.message}</p>}
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="group w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-70 shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>

                <p className="text-center text-sm text-neutral-500">
                  Don&apos;t have access?{" "}
                  <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Contact Administrator</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center lg:text-left">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
                    <KeyRound className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">2FA Verification</h2>
                  <p className="text-neutral-400 mt-2">
                    Open your authenticator app and enter the 6-digit code.
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-6">
                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-300">Authenticator Code</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                      <input
                        {...otpForm.register("otp")}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        autoFocus
                        className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`}
                      />
                    </div>
                    {otpForm.formState.errors.otp && <p className="text-red-400 text-xs font-medium">{otpForm.formState.errors.otp.message}</p>}
                  </div>

                  <button type="submit" disabled={loading}
                    className="group w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-70 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </button>

                  <button type="button" onClick={() => { setStep("credentials"); setErrorMsg(""); }}
                    className="w-full flex justify-center items-center gap-2 py-2.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
