"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Sun, Moon, Monitor, Loader2, CheckCircle2, AlertCircle, Camera, Trash2, ShieldCheck, ShieldOff, KeyRound, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/frontend/lib/toast";
import Image from "next/image";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string; description: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function InputField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</label>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// ─── Profile section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => {
        setName(d.name ?? "");
        setEmail(d.email ?? "");
        setImage(d.image ?? null);
      })
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (res.ok) toast("Profile updated successfully.", "success");
    else toast("Failed to update profile.", "error");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/users/me/avatar", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setImage(data.image);
      toast("Profile photo updated.", "success");
    } else {
      const data = await res.json();
      toast(data.error ?? "Failed to upload photo.", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    const res = await fetch("/api/users/me/avatar", { method: "DELETE" });
    setUploading(false);
    if (res.ok) { setImage(null); toast("Profile photo removed.", "success"); }
    else toast("Failed to remove photo.", "error");
  };

  if (loading) return <div className="h-28 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" />;

  const initials = (name || email || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative flex-shrink-0">
          {image ? (
            <Image
              src={image}
              alt="Avatar"
              width={64}
              height={64}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow-lg select-none">
              {initials}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="font-semibold text-neutral-900 dark:text-white">{name || "–"}</p>
          <p className="text-sm text-neutral-500">{email}</p>
          <div className="flex items-center gap-2 pt-0.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
              title="Upload profile photo"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {image ? "Change Photo" : "Upload Photo"}
            </button>
            {image && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-neutral-400">JPG, PNG, WEBP, GIF · Max 2MB</p>
        </div>
      </div>

      <InputField label="Full Name" value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Your name" title="Full name" required />
      <InputField label="Email" value={email} disabled title="Email cannot be changed" />

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}

// ─── Password section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match."); return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters."); return;
    }
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Password changed successfully.", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to change password.");
      toast("Failed to change password.", "error");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      <InputField label="Current Password" type="password" value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••"
        title="Current password" required />
      <InputField label="New Password" type="password" value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters"
        title="New password" required />
      <InputField label="Confirm New Password" type="password" value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password"
        title="Confirm new password" required />
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Change Password
        </button>
      </div>
    </form>
  );
}

// ─── Two-Factor Auth section ───────────────────────────────────────────────────

type TwoFAStep = "idle" | "setup" | "disable";

function TwoFactorSection() {
  const toast = useToast();
  const [enabled, setEnabled]   = useState<boolean | null>(null);
  const [step, setStep]         = useState<TwoFAStep>("idle");
  const [qrUrl, setQrUrl]       = useState("");
  const [secret, setSecret]     = useState("");
  const [otp, setOtp]           = useState("");
  const [disablePass, setDisablePass] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setEnabled(!!d.twoFactorEnabled))
      .catch(() => setEnabled(false));
  }, []);

  const handleSetup = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/auth/2fa/setup");
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to start setup."); return; }
    const d = await res.json();
    setQrUrl(d.qrDataUrl); setSecret(d.secret); setStep("setup"); setOtp("");
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Code must be 6 digits."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/2fa/enable", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Invalid code."); return; }
    setEnabled(true); setStep("idle"); setQrUrl(""); setSecret(""); setOtp("");
    toast("2FA enabled successfully!", "success");
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePass) { setError("Enter your password."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: disablePass }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to disable."); return; }
    setEnabled(false); setStep("idle"); setDisablePass("");
    toast("2FA disabled.", "success");
  };

  if (enabled === null) return <div className="h-16 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" />;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        enabled
          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
          : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
      }`}>
        <div className="flex items-center gap-3">
          {enabled
            ? <ShieldCheck className="w-5 h-5 text-emerald-500" />
            : <ShieldOff className="w-5 h-5 text-neutral-400" />}
          <div>
            <p className={`text-sm font-semibold ${enabled ? "text-emerald-700 dark:text-emerald-400" : "text-neutral-700 dark:text-neutral-300"}`}>
              {enabled ? "2FA Enabled" : "2FA Disabled"}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {enabled ? "Your account is protected by two-step verification." : "Enable for extra login security."}
            </p>
          </div>
        </div>
        {step === "idle" && (
          <button type="button"
            onClick={() => { setError(""); enabled ? setStep("disable") : handleSetup(); }}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
              enabled
                ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
                : "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
            }`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : enabled ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {enabled ? "Disable" : "Enable 2FA"}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Setup flow */}
      {step === "setup" && qrUrl && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-5 p-5 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">1. Scan QR Code</p>
            <p className="text-xs text-neutral-500 mb-4">Open Google Authenticator, Authy, or a similar app, then scan this code.</p>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="2FA QR Code" className="w-48 h-48 rounded-xl border border-neutral-200 dark:border-neutral-700" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Or enter the manual key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-700 dark:text-neutral-300 select-all break-all">
                {secret}
              </code>
              <button type="button" onClick={() => { navigator.clipboard.writeText(secret); toast("Key copied!", "success"); }}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleEnable} className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">2. Enter verification code</p>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6} inputMode="numeric"
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setStep("idle"); setError(""); setOtp(""); }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Enable 2FA
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Disable flow */}
      {step === "disable" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-200 dark:border-red-500/20 space-y-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            Enter your account password to disable 2FA.
          </p>
          <form onSubmit={handleDisable} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="password" value={disablePass} onChange={(e) => setDisablePass(e.target.value)}
                placeholder="Your password" autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setStep("idle"); setError(""); setDisablePass(""); }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !disablePass}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                Disable 2FA
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}

// ─── Appearance section ────────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light",  label: "Light",  icon: Sun },
    { value: "dark",   label: "Dark",   icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  if (!mounted) return <div className="h-16 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" />;

  return (
    <div className="flex gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
              active
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            <Icon className="w-5 h-5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your profile and account preferences.</p>
      </div>

      <Section
        title="Profile"
        description="Update your name and account information."
      >
        <ProfileSection />
      </Section>

      <Section
        title="Security"
        description="Change your password to keep your account secure."
      >
        <PasswordSection />
      </Section>

      <Section
        title="Two-Factor Authentication (2FA)"
        description="Add an extra layer of security with a verification code at login."
      >
        <TwoFactorSection />
      </Section>

      <Section
        title="Appearance"
        description="Choose the interface theme that suits your preference."
      >
        <AppearanceSection />
      </Section>
    </div>
  );
}
