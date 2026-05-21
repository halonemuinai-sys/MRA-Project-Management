"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Mail, Lock, ArrowRight, ShieldCheck, KeyRound,
  ArrowLeft, CheckCircle2, RefreshCw, Eye, EyeOff, Check,
} from "lucide-react";
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

// ─── Deterministic particles ──────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:     ((i * 41 + 11) % 88) + 6,
  top:      ((i * 37 + 7)  % 82) + 6,
  size:     i % 4 === 0 ? 5 : i % 3 === 0 ? 4 : 3,
  duration: 4 + (i % 4),
  delay:    (i * 0.4) % 3,
  yOffset:  i % 2 === 0 ? -10 : 10,
}));

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex w-[52%] relative overflow-hidden flex-col items-center justify-center"
      style={{ background: "linear-gradient(140deg, #dde4ff 0%, #e8e2ff 35%, #ede9fe 65%, #f5f3ff 100%)" }}
    >
      {/* Circuit SVG lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
        <line x1="0"   y1="25%"  x2="30%" y2="25%"  stroke="#6366f1" strokeWidth="1" />
        <line x1="30%" y1="25%"  x2="30%" y2="12%"  stroke="#6366f1" strokeWidth="1" />
        <line x1="30%" y1="12%"  x2="55%" y2="12%"  stroke="#6366f1" strokeWidth="1" />
        <circle cx="30%" cy="25%" r="3" fill="#6366f1" />
        <circle cx="55%" cy="12%" r="3" fill="#6366f1" />

        <line x1="100%" y1="35%" x2="72%" y2="35%" stroke="#6366f1" strokeWidth="1" />
        <line x1="72%"  y1="35%" x2="72%" y2="55%" stroke="#6366f1" strokeWidth="1" />
        <line x1="72%"  y1="55%" x2="88%" y2="55%" stroke="#6366f1" strokeWidth="1" />
        <circle cx="72%" cy="35%" r="3" fill="#6366f1" />
        <circle cx="72%" cy="55%" r="3" fill="#6366f1" />

        <line x1="0"   y1="68%"  x2="22%" y2="68%"  stroke="#6366f1" strokeWidth="1" />
        <line x1="22%" y1="68%"  x2="22%" y2="82%"  stroke="#6366f1" strokeWidth="1" />
        <line x1="22%" y1="82%"  x2="45%" y2="82%"  stroke="#6366f1" strokeWidth="1" />
        <circle cx="22%" cy="68%" r="3" fill="#6366f1" />
        <circle cx="45%" cy="82%" r="3" fill="#6366f1" />

        <line x1="100%" y1="78%" x2="78%" y2="78%" stroke="#6366f1" strokeWidth="1" />
        <line x1="78%"  y1="78%" x2="78%" y2="92%" stroke="#6366f1" strokeWidth="1" />
        <circle cx="78%" cy="78%" r="3" fill="#6366f1" />
      </svg>

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400/50"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
          animate={{ y: [0, p.yOffset, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-14 gap-7 select-none">

        {/* Logo card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-28 h-28 rounded-[2rem] bg-white shadow-2xl shadow-indigo-200/60 flex items-center justify-center border border-indigo-100"
        >
          <ShieldCheck className="w-14 h-14 text-indigo-600" strokeWidth={1.8} />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 border border-indigo-100 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
          <span className="text-sm font-medium text-indigo-700">Secure • Intelligent • Reliable</span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-5xl font-black text-gray-900 leading-tight tracking-tight">
            MRA Project<br />Management
          </h1>
          <p className="text-gray-500 mt-3 text-base font-medium">
            Manage projects. Mitigate risks. Deliver success.
          </p>
        </motion.div>

        {/* Bottom mockup cards */}
        <div className="flex items-end gap-4 mt-2">
          {/* Chart card */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white rounded-2xl shadow-xl shadow-indigo-100/80 p-4 w-44 border border-indigo-50"
          >
            <div className="flex items-center justify-center mb-3">
              <svg viewBox="0 0 64 64" className="w-14 h-14">
                <circle cx="32" cy="32" r="24" fill="none" stroke="#e0e7ff" strokeWidth="10" />
                <circle cx="32" cy="32" r="24" fill="none" stroke="#6366f1" strokeWidth="10"
                  strokeDasharray="96 55" strokeLinecap="round"
                  transform="rotate(-90 32 32)" />
                <circle cx="32" cy="32" r="24" fill="none" stroke="#a5b4fc" strokeWidth="10"
                  strokeDasharray="40 111" strokeDashoffset="-96" strokeLinecap="round"
                  transform="rotate(-90 32 32)" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 bg-indigo-100 rounded-full w-full" />
              <div className="h-2 bg-indigo-50 rounded-full w-3/4" />
              <div className="h-2 bg-indigo-50 rounded-full w-1/2" />
            </div>
          </motion.div>

          {/* Checklist card */}
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl shadow-indigo-100/80 p-4 w-36 border border-indigo-50"
          >
            {[true, true, false].map((done, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-indigo-500" : "bg-gray-100 border border-gray-200"}`}>
                  {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className={`h-2 rounded-full flex-1 ${done ? "bg-gray-200" : "bg-gray-100"}`} />
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </div>
  );
}

// ─── Login Content ────────────────────────────────────────────────────────────

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep]   = useState<"credentials" | "otp">("credentials");
  const [pendingCredentials, setPendingCredentials] = useState<LoginValues | null>(null);
  const [errorMsg, setErrorMsg]             = useState("");
  const [loading, setLoading]               = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending]           = useState(false);
  const [resent, setResent]                 = useState(false);

  const justVerified   = searchParams.get("verified")   === "true";
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

  const onSubmitCredentials = async (data: LoginValues) => {
    setLoading(true); setErrorMsg(""); setUnverifiedEmail("");
    const res = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);
    if (res?.error === "REQUIRES_2FA")            { setPendingCredentials(data); setStep("otp"); }
    else if (res?.error === "EMAIL_NOT_VERIFIED") setUnverifiedEmail(data.email);
    else if (res?.error)                          setErrorMsg("Incorrect email or password.");
    else { router.push("/dashboard"); router.refresh(); }
  };

  const onSubmitOtp = async (data: OtpValues) => {
    if (!pendingCredentials) return;
    setLoading(true); setErrorMsg("");
    const res = await signIn("credentials", { ...pendingCredentials, otp: data.otp, redirect: false });
    setLoading(false);
    if (res?.error) setErrorMsg(res.error === "REQUIRES_2FA" ? "2FA code required." : res.error);
    else { router.push("/dashboard"); router.refresh(); }
  };

  const inputCls =
    "w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 " +
    "focus:border-indigo-400 transition-all";

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">

      <LeftPanel />

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">MRA</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Credentials ── */}
            {step === "credentials" && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="space-y-7"
              >
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">Welcome Back</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Sign in to your MRA account to continue</p>
                  </div>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                  {justVerified && (
                    <motion.div key="v" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Email verified. You can now sign in.
                    </motion.div>
                  )}
                  {justRegistered && !justVerified && (
                    <motion.div key="r" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                      <Mail className="w-4 h-4 flex-shrink-0" /> Check your email for the verification link.
                    </motion.div>
                  )}
                  {unverifiedEmail && (
                    <motion.div key="u" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm space-y-2">
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email not verified</div>
                      {!resent ? (
                        <button type="button" onClick={handleResend} disabled={resending}
                          className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 disabled:opacity-50">
                          <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                          {resending ? "Sending…" : "Resend verification email"}
                        </button>
                      ) : <span className="text-xs text-emerald-600">✓ Email resent</span>}
                    </motion.div>
                  )}
                  {errorMsg && (
                    <motion.div key="e" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" /> {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={loginForm.handleSubmit(onSubmitCredentials)} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                      <input {...loginForm.register("email")} type="email" placeholder="Enter your email" className={inputCls} />
                    </div>
                    {loginForm.formState.errors.email && <p className="text-red-500 text-xs">{loginForm.formState.errors.email.message}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700">Password</label>
                      <Link href="/forgot-password" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                      <input
                        {...loginForm.register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`${inputCls} pr-11`}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && <p className="text-red-500 text-xs">{loginForm.formState.errors.password.message}</p>}
                  </div>

                  {/* Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-lg shadow-indigo-200"
                  >
                    <motion.div
                      className="absolute inset-0 -skew-x-12"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
                      initial={{ x: "-200%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                    }
                  </motion.button>
                </form>

                <p className="text-center text-sm text-gray-400">
                  Don&apos;t have access?{" "}
                  <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Contact Administrator
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="space-y-7"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm mb-4">
                    <KeyRound className="w-6 h-6 text-indigo-600" strokeWidth={1.8} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">2FA Verification</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter the 6-digit code from your authenticator app</p>
                </div>

                {errorMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" /> {errorMsg}
                  </motion.div>
                )}

                <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Authenticator Code</label>
                    <input
                      {...otpForm.register("otp")}
                      type="text" inputMode="numeric" maxLength={6}
                      placeholder="000000" autoFocus
                      className={`${inputCls} text-center text-2xl tracking-[0.6em] font-mono pl-4`}
                    />
                    {otpForm.formState.errors.otp && <p className="text-red-500 text-xs">{otpForm.formState.errors.otp.message}</p>}
                  </div>

                  <motion.button
                    type="submit" disabled={loading}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-lg shadow-indigo-200"
                  >
                    <motion.div
                      className="absolute inset-0 -skew-x-12"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
                      initial={{ x: "-200%" }} animate={{ x: "200%" }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify & Sign In</span><ArrowRight className="w-4 h-4" /></>}
                  </motion.button>

                  <button type="button" onClick={() => { setStep("credentials"); setErrorMsg(""); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
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
