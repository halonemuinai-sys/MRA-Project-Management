"use client";

import { motion } from "framer-motion";
import { Activity, CreditCard, Users, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Total Pendapatan", value: "Rp 1.4B", icon: CreditCard, change: "+12.5%", positive: true },
    { title: "Pengguna Aktif", value: "2,350", icon: Users, change: "+5.2%", positive: true },
    { title: "Proyek Selesai", value: "84", icon: Activity, change: "-1.5%", positive: false },
    { title: "Tingkat Konversi", value: "4.3%", icon: TrendingUp, change: "+2.1%", positive: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Ikhtisar Bisnis</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Pantau metrik utama performa operasional MRA Retail.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">{stat.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
              <span className="text-neutral-400 ml-2">dari bulan lalu</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Placeholder for Analytics Chart */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 h-96 flex items-center justify-center">
        <p className="text-neutral-400 dark:text-neutral-600 font-medium">Grafik Data (Akan diselesaikan menggunakan Recharts di Epic 4.3)</p>
      </div>
    </div>
  );
}
