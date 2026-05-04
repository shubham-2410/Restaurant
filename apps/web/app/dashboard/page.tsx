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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setError(null);
    try {
      const [s, items, h] = await Promise.all([
        api.dashboard.summary(),
        api.dashboard.topItems(),
        api.dashboard.hourlyRevenue(),
      ]);
      setSummary(s);
      setTopItems(items);
      setHourly(h);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
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
      <div className="page-wrapper" style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between mb-5">
            <span>{error}</span>
            <button onClick={() => load(true)} className="text-red-600 underline text-xs ml-4 shrink-0">Retry</button>
          </div>
        )}

        <div className="page-header animate-fade-in">
          <div>
            <p className="text-xs text-slate-400 mb-1 font-medium">{dateStr}</p>
            <h1 className="page-title">
              {greeting()}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="page-subtitle">
              Here&rsquo;s what&rsquo;s happening at <strong>{user?.tenant?.name}</strong>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(true)} loading={refreshing}>
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 animate-slide-up">
          {loading
            ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            : summary
              ? [
                  { label: "Today's Revenue",  value: formatCurrency(summary.todayRevenue),  icon: DollarSign,    iconColor: "text-emerald-600", iconBg: "bg-emerald-50", accent: "emerald" as const },
                  { label: "Today's Orders",   value: summary.todayOrders,                   icon: ShoppingBag,   iconColor: "text-blue-600",    iconBg: "bg-blue-50",    accent: "blue"    as const },
                  { label: "Active Orders",    value: summary.activeOrders,                  icon: Activity,      iconColor: "text-orange-600",  iconBg: "bg-orange-50",  accent: "orange"  as const },
                  { label: "Tables Occupied",  value: `${summary.occupiedTables}/${summary.occupiedTables + summary.availableTables}`, icon: UtensilsCrossed, iconColor: "text-purple-600", iconBg: "bg-purple-50", accent: "purple" as const },
                  { label: "Pending KOTs",     value: summary.pendingKots,                   icon: ChefHat,       iconColor: "text-red-600",     iconBg: "bg-red-50",     accent: "red"     as const },
                ].map((s) => <StatsCard key={s.label} {...s} />)
              : null
          }
        </div>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Available Tables", value: summary.availableTables, colorClass: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: Grid2X2 },
              { label: "Occupied Tables",  value: summary.occupiedTables,  colorClass: "text-red-600",     bg: "bg-red-50 border-red-100",         icon: UtensilsCrossed },
              { label: "Active Orders",    value: summary.activeOrders,    colorClass: "text-orange-600",  bg: "bg-orange-50 border-orange-100",   icon: ShoppingBag },
              { label: "KOTs in Queue",    value: summary.pendingKots,     colorClass: "text-purple-600",  bg: "bg-purple-50 border-purple-100",   icon: ChefHat },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`rounded-2xl p-4 border ${s.bg}`}>
                  <Icon className={`w-4 h-4 mb-2 ${s.colorClass}`} />
                  <p className={`text-2xl font-black tabular-nums ${s.colorClass}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="content-card lg:col-span-3">
            <div className="content-card__header">
              <div>
                <p className="content-card__title">Revenue Today</p>
                <p className="content-card__subtitle">Hourly breakdown</p>
              </div>
              <div className="content-card__icon bg-orange-50">
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="p-5">
              {hourly.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                      labelFormatter={(h) => `${h}:00`}
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}
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
          </div>

          <div className="content-card lg:col-span-2">
            <div className="content-card__header">
              <div>
                <p className="content-card__title">Top Sellers</p>
                <p className="content-card__subtitle">By quantity sold</p>
              </div>
              <div className="content-card__icon bg-blue-50">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="p-5">
              {topItems.length > 0 ? (
                <ul>
                  {topItems.slice(0, 6).map((item, i) => {
                    const pct = Math.min(100, (item.total_qty / (topItems[0]?.total_qty ?? 1)) * 100);
                    return (
                      <li key={item.name} className="top-item-row">
                        <span className={`top-item-rank${i === 0 ? " top-item-rank--first" : ""}`}>{i + 1}</span>
                        <div className="progress-track min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.name}</p>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ "--progress-width": `${pct}%` } as React.CSSProperties}
                            />
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

      </div>
    </AppLayout>
  );
}
