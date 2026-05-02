"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary, TopItem, HourlyRevenue } from "@restaurant/shared";
import {
  DollarSign, ShoppingBag, UtensilsCrossed, ChefHat,
  RefreshCcw, TrendingUp, Grid2X2, Activity,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { SkeletonCard } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary]   = useState<DashboardSummary | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [hourly, setHourly]     = useState<HourlyRevenue[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [s, items, h] = await Promise.all([
        api.dashboard.summary(),
        api.dashboard.topItems(),
        api.dashboard.hourlyRevenue(),
      ]);
      setSummary(s);
      setTopItems(items);
      setHourly(h);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-0.5">{dateStr}</p>
            <h1 className="text-2xl font-black text-slate-900">
              {greeting()}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's what's happening at <span className="font-semibold text-slate-700">{user?.tenant?.name}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(true)} loading={refreshing} className="shrink-0">
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {loading
            ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            : summary ? [
                { label: "Today's Revenue",  value: formatCurrency(summary.todayRevenue),  icon: DollarSign,    iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
                { label: "Today's Orders",   value: summary.todayOrders,                   icon: ShoppingBag,   iconColor: "text-blue-600",    iconBg: "bg-blue-50" },
                { label: "Active Orders",    value: summary.activeOrders,                  icon: Activity,      iconColor: "text-orange-600",  iconBg: "bg-orange-50" },
                { label: "Tables Occupied",  value: `${summary.occupiedTables}/${summary.occupiedTables + summary.availableTables}`, icon: UtensilsCrossed, iconColor: "text-purple-600", iconBg: "bg-purple-50" },
                { label: "Pending KOTs",     value: summary.pendingKots,                   icon: ChefHat,       iconColor: "text-red-600",     iconBg: "bg-red-50" },
              ].map((s) => <StatsCard key={s.label} {...s} />)
            : null
          }
        </div>

        {/* Status quick-look */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Available Tables", value: summary.availableTables, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100",  icon: Grid2X2 },
              { label: "Occupied Tables",  value: summary.occupiedTables,  color: "text-red-600",     bg: "bg-red-50 border-red-100",           icon: UtensilsCrossed },
              { label: "Active Orders",    value: summary.activeOrders,    color: "text-orange-600",  bg: "bg-orange-50 border-orange-100",     icon: ShoppingBag },
              { label: "KOTs in Queue",    value: summary.pendingKots,     color: "text-purple-600",  bg: "bg-purple-50 border-purple-100",     icon: ChefHat },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={cn("rounded-2xl p-4 border", s.bg)}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("w-4 h-4", s.color)} />
                  </div>
                  <p className={cn("text-2xl font-black tabular-nums", s.color)}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Revenue chart */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900">Revenue Today</h2>
                <p className="text-xs text-slate-400 mt-0.5">Hourly breakdown</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            {hourly.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    labelFormatter={(h) => `${h}:00`}
                    contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-300 gap-2">
                <TrendingUp className="w-10 h-10" />
                <p className="text-sm text-slate-400">No revenue data yet today</p>
              </div>
            )}
          </div>

          {/* Top items */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900">Top Sellers</h2>
                <p className="text-xs text-slate-400 mt-0.5">By quantity sold</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            {topItems.length > 0 ? (
              <ul className="space-y-3.5">
                {topItems.slice(0, 6).map((item, i) => {
                  const pct = Math.min(100, (item.total_qty / (topItems[0]?.total_qty ?? 1)) * 100);
                  return (
                    <li key={item.name} className="flex items-center gap-3">
                      <span className={`text-xs font-black w-5 text-center shrink-0 ${i === 0 ? "text-orange-500" : "text-slate-400"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.name}</p>
                        <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-700">{item.total_qty}×</p>
                        <p className="text-xs text-slate-400">{formatCurrency(item.revenue)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-300">
                <ShoppingBag className="w-10 h-10" />
                <p className="text-sm text-slate-400">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
