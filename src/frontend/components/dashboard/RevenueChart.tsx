"use client";

import { useTheme } from "next-themes";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", revenue: 4000, expenses: 2400 },
  { name: "Feb", revenue: 3000, expenses: 1398 },
  { name: "Mar", revenue: 5000, expenses: 3800 },
  { name: "Apr", revenue: 4500, expenses: 3908 },
  { name: "May", revenue: 6000, expenses: 4800 },
  { name: "Jun", revenue: 7500, expenses: 3800 },
  { name: "Jul", revenue: 8500, expenses: 4300 },
];

export function RevenueChart() {
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === "dark";
  const strokeColor = isDark ? "#818cf8" : "#4f46e5"; // Indigo
  const fillColor = isDark ? "rgba(129, 140, 248, 0.2)" : "rgba(79, 70, 229, 0.2)";
  const expenseColor = isDark ? "#a78bfa" : "#9333ea"; // Purple
  const expenseFillColor = isDark ? "rgba(167, 139, 250, 0.2)" : "rgba(147, 51, 234, 0.2)";

  return (
    <div className="h-full w-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={expenseColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={expenseColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            stroke={isDark ? "#525252" : "#a3a3a3"} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke={isDark ? "#525252" : "#a3a3a3"} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `Rp${value / 1000}M`}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#262626" : "#e5e5e5"} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? "#171717" : "#ffffff", 
              borderColor: isDark ? "#262626" : "#e5e5e5",
              borderRadius: "12px",
              color: isDark ? "#e5e5e5" : "#171717"
            }} 
            itemStyle={{ fontWeight: 600 }}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            name="Pendapatan"
            stroke={strokeColor} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            name="Pengeluaran"
            stroke={expenseColor} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpense)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
