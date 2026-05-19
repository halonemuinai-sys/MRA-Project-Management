"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard MRA</h1>
        <p className="text-neutral-500">Selamat! Anda telah berhasil login ke dalam sistem MRA Project Management.</p>
        
        <div className="pt-8">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Keluar (Logout)
          </button>
        </div>
      </div>
    </div>
  );
}
