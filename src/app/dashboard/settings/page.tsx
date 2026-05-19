"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Sun, Moon, Monitor, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/frontend/lib/toast";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => { setName(d.name ?? ""); setEmail(d.email ?? ""); setLoading(false); });
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
    if (res.ok) {
      toast("Profil berhasil diperbarui.", "success");
    } else {
      toast("Gagal memperbarui profil.", "error");
    }
  };

  if (loading) return <div className="h-24 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" />;

  const initials = (name || email || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-neutral-900 dark:text-white">{name || "–"}</p>
          <p className="text-sm text-neutral-500">{email}</p>
        </div>
      </div>

      <InputField label="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Nama Anda" title="Nama lengkap" required />
      <InputField label="Email" value={email} disabled title="Email tidak dapat diubah" />

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Simpan Perubahan
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
      setError("Password baru tidak cocok."); return;
    }
    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter."); return;
    }
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Password berhasil diubah.", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal mengubah password.");
      toast("Gagal mengubah password.", "error");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      <InputField label="Password Saat Ini" type="password" value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••"
        title="Password saat ini" required />
      <InputField label="Password Baru" type="password" value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter"
        title="Password baru" required />
      <InputField label="Konfirmasi Password Baru" type="password" value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru"
        title="Konfirmasi password baru" required />
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Ubah Password
        </button>
      </div>
    </form>
  );
}

// ─── Appearance section ────────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light",  label: "Terang",  icon: Sun },
    { value: "dark",   label: "Gelap",   icon: Moon },
    { value: "system", label: "Sistem",  icon: Monitor },
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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Pengaturan</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Kelola profil dan preferensi akun Anda.</p>
      </div>

      <Section
        title="Profil"
        description="Perbarui nama dan informasi akun Anda."
      >
        <ProfileSection />
      </Section>

      <Section
        title="Keamanan"
        description="Ubah password untuk menjaga keamanan akun."
      >
        <PasswordSection />
      </Section>

      <Section
        title="Tampilan"
        description="Pilih tema antarmuka yang sesuai selera Anda."
      >
        <AppearanceSection />
      </Section>
    </div>
  );
}
