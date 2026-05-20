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

// ─── Deterministic particles (no hydration mismatch) ─────────────────────────

const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  left: ((i * 41 + 11) % 90) + 5,
  top:  ((i * 37 + 7)  % 85) + 7,
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2.5 : 1.5,
  duration: 4 + (i % 5),
  delay:    (i * 0.35) % 3,
  yOffset:  i % 2 === 0 ? -14 : 14,
  opacity:  i % 4 === 0 ? 0.9 : 0.5,
}));

// ─── Tech Background ──────────────────────────────────────────────────────────

function TechBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glowing orbs */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 560, height: 560, left: "-18%", top: "-20%", background: "radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)" }}
        animate={{ x: [0, 35, 0], y: [0, 25, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ width: 440, height: 440, right: "-12%", bottom: "-18%", background: "radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)" }}
        animate={{ x: [0, -28, 0], y: [0, -22, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ width: 320, height: 320, left: "42%", top: "38%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)" }}
        animate={{ x: [0, 22, -12, 0], y: [0, -18, 12, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 30%, rgba(99,102,241,0.9) 50%, rgba(99,102,241,0.6) 70%, transparent 100%)" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
      {/* Second scan (offset) */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 40%, rgba(59,130,246,0.6) 50%, rgba(59,130,246,0.4) 60%, transparent 100%)" }}
        animate={{ top: ["100%", "0%"] }}
        transition={{ duration: 11, repeat: Infinity, ease: "linear", delay: 3 }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top:  `${p.top}%`,
            width:  p.size,
            height: p.size,
            background: "#6366f1",
            boxShadow: `0 0 ${p.size * 4}px rgba(99,102,241,0.9)`,
          }}
          animate={{ y: [0, p.yOffset, 0], opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.4] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Circuit corner — top-left */}
      <svg className="absolute top-0 left-0 w-52 h-52 opacity-25" viewBox="0 0 200 200" fill="none">
        <motion.path
          d="M0 50 L50 50 L50 0"
          stroke="#6366f1" strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.path
          d="M0 90 L90 90 L90 50 L130 50 L130 0"
          stroke="#6366f1" strokeWidth="0.6" strokeDasharray="5 5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.circle cx="50" cy="50" r="4" fill="#6366f1"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 }} />
        <motion.circle cx="90" cy="90" r="3" fill="#3b82f6"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8 }} />
        <motion.circle cx="130" cy="50" r="2" fill="#6366f1"
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
      </svg>

      {/* Circuit corner — bottom-right */}
      <svg className="absolute bottom-0 right-0 w-52 h-52 opacity-25" viewBox="0 0 200 200" fill="none">
        <motion.path
          d="M200 150 L150 150 L150 200"
          stroke="#6366f1" strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
        />
        <motion.path
          d="M200 110 L110 110 L110 150 L70 150 L70 200"
          stroke="#6366f1" strokeWidth="0.6" strokeDasharray="5 5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 0.8, ease: "easeInOut" }}
        />
        <motion.circle cx="150" cy="150" r="4" fill="#6366f1"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2 }} />
        <motion.circle cx="110" cy="110" r="3" fill="#3b82f6"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.3 }} />
        <motion.circle cx="70" cy="150" r="2" fill="#6366f1"
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
      </svg>
    </div>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center gap-0.5"
    >
      <span className="text-xl font-black text-white tabular-nums">{value}</span>
      <span className="text-[10px] font-semibold text-indigo-400/50 uppercase tracking-widest">{label}</span>
    </motion.div>
  );
}

// ─── Login Content ────────────────────────────────────────────────────────────

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pendingCredentials, setPendingCredentials] = useState<LoginValues | null>(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending]     = useState(false);
  const [resent, setResent]           = useState(false);

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
    if (res?.error === "REQUIRES_2FA")        { setPendingCredentials(data); setStep("otp"); }
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
    "w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl text-white text-sm " +
    "placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all";

  return (
    <div className="min-h-screen w-full flex bg-[#020817] text-white">

      {/* ── Left: Tech panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex w-[58%] relative overflow-hidden flex-col items-center justify-center">
        <TechBackground />

        <div className="relative z-10 flex flex-col items-center text-center px-16 gap-10 select-none">

          {/* Shield with pulse rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-[2rem] bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="w-14 h-14 text-indigo-400" style={{ filter: "drop-shadow(0 0 12px rgba(99,102,241,0.6))" }} />
            </div>
            {[1, 1.4, 1.8].map((scale, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-[2rem] border border-indigo-500/30"
                animate={{ scale: [1, scale, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.6 }}
              />
            ))}
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="space-y-2"
          >
            <h1 className="text-7xl font-black tracking-tighter text-white leading-none"
              style={{ textShadow: "0 0 40px rgba(99,102,241,0.4)" }}>
              MRA
            </h1>
            <p className="text-base font-semibold text-indigo-300/60 tracking-[0.3em] uppercase">
              Project Management
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2.5"
          >
            {[
              { label: "Enterprise",  icon: "⚡" },
              { label: "Governance",  icon: "🛡" },
              { label: "Zero-Trust",  icon: "🔐" },
            ].map((chip, i) => (
              <motion.span
                key={chip.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/50"
              >
                <span>{chip.icon}</span>
                {chip.label}
              </motion.span>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="flex items-center gap-10 pt-6 border-t border-white/[0.07] w-full justify-center"
          >
            <StatItem value="99.9%"    label="Uptime"      delay={0.85} />
            <div className="w-px h-8 bg-white/[0.07]" />
            <StatItem value="AES-256"  label="Encryption"  delay={0.95} />
            <div className="w-px h-8 bg-white/[0.07]" />
            <StatItem value="ISO 27001" label="Certified"  delay={1.05} />
          </motion.div>
        </div>
      </div>

      {/* ── Right: Form panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Ambient right glow */}
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-[360px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xl font-bold">MRA</span>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-8 backdrop-blur-sm">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Credentials ── */}
              {step === "credentials" && (
                <motion.div key="credentials"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Access Portal</h2>
                    <p className="text-xs text-white/35 mt-1 font-medium">Authenticate to continue</p>
                  </div>

                  {/* Alert banners */}
                  <AnimatePresence>
                    {justVerified && (
                      <motion.div key="v" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        Email verified — you can sign in now.
                      </motion.div>
                    )}
                    {justRegistered && !justVerified && (
                      <motion.div key="r" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        Check your email for the verification link.
                      </motion.div>
                    )}
                    {unverifiedEmail && (
                      <motion.div key="u" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="px-3.5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-medium"><Mail className="w-3.5 h-3.5" /> Email not verified</div>
                        {!resent ? (
                          <button type="button" onClick={handleResend} disabled={resending}
                            className="flex items-center gap-1.5 text-amber-300/60 hover:text-amber-300 transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                            {resending ? "Sending…" : "Resend link"}
                          </button>
                        ) : (
                          <span className="text-emerald-400">✓ Email resent</span>
                        )}
                      </motion.div>
                    )}
                    {errorMsg && (
                      <motion.div key="e" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        {errorMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={loginForm.handleSubmit(onSubmitCredentials)} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                        <input {...loginForm.register("email")} type="email" placeholder="you@mra.com" className={inputCls} />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-red-400 text-xs">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Password</label>
                        <Link href="/forgot-password" className="text-[10px] text-indigo-400/50 hover:text-indigo-400 transition-colors font-semibold">
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                        <input {...loginForm.register("password")} type="password" placeholder="••••••••" className={inputCls} />
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-red-400 text-xs">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    {/* Sign In button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="relative w-full mt-1 overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                      style={{ boxShadow: "0 0 24px rgba(99,102,241,0.45)" }}
                    >
                      {/* Shimmer */}
                      <motion.div
                        className="absolute inset-0 -skew-x-12"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
                        initial={{ x: "-200%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 0.8 }}
                      />
                      {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                      }
                    </motion.button>
                  </form>

                  <p className="text-center text-[11px] text-white/20">
                    Need access?{" "}
                    <Link href="/register" className="text-indigo-400/60 hover:text-indigo-400 transition-colors font-medium">
                      Contact Administrator
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === "otp" && (
                <motion.div key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                      <KeyRound className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">2FA Verification</h2>
                    <p className="text-xs text-white/35 mt-1 font-medium">Enter the 6-digit code from your authenticator app</p>
                  </div>

                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}

                  <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Authenticator Code</label>
                      <input
                        {...otpForm.register("otp")}
                        type="text" inputMode="numeric" maxLength={6}
                        placeholder="000000" autoFocus
                        className={`${inputCls} text-center text-2xl tracking-[0.6em] font-mono pl-4`}
                      />
                      {otpForm.formState.errors.otp && (
                        <p className="text-red-400 text-xs">{otpForm.formState.errors.otp.message}</p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                      style={{ boxShadow: "0 0 24px rgba(99,102,241,0.45)" }}
                    >
                      <motion.div
                        className="absolute inset-0 -skew-x-12"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
                        initial={{ x: "-200%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 0.8 }}
                      />
                      {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><span>Verify</span><ArrowRight className="w-4 h-4" /></>
                      }
                    </motion.button>

                    <button type="button" onClick={() => { setStep("credentials"); setErrorMsg(""); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-white/25 hover:text-white/50 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
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
