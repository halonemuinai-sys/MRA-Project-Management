"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg("Email atau password yang Anda masukkan salah.");
      } else {
        router.push("/dashboard"); 
        router.refresh();
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan pada server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-neutral-950 text-neutral-200 font-sans">
      {/* Left Section - Graphic / Branding */}
      <div className="hidden lg:flex flex-1 relative bg-neutral-900 overflow-hidden items-center justify-center">
        {/* Abstract glowing blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <ShieldCheck className="w-24 h-24 text-indigo-500 mb-8 mx-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
              MRA Project <br/> Management
            </h1>
            <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
              Platform manajemen operasional dan tata kelola IT premium untuk efisiensi bisnis korporat.
            </p>
          </motion.div>
        </div>
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-sm pointer-events-none" />
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">Selamat Datang</h2>
            <p className="text-neutral-400 mt-2">Masuk ke akun MRA Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {errorMsg}
              </motion.div>
            )}

            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">Email Akses</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="admin@mra.com"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1 font-medium">{errors.email.message}</p>}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-300">Kata Sandi</label>
                  <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                    Lupa sandi?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                  />
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1 font-medium">{errors.password.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Masuk Sistem
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-8">
            Belum memiliki akses?{' '}
            <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Hubungi Administrator
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
