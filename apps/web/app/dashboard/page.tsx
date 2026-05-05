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
import { StatsCard, SkeletonStatCard } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
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

  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <AppLayout>
      <div className="page-section" style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
            <span>{error}</span>
            <button onClick={() => load(true)} className="text-red-600 underline text-xs shrink-0 font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="page-header">
          <div>
            <p className="text-xs text-gray-400 mb-0.5 font-medium">{dateStr}</p>
            <h1 className="page-title">
              <span className="page-title-bar" />
              {greeting()}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="page-subtitle">
              Here&rsquo;s what&rsquo;s happening at{" "}
              <strong className="text-gray-700">{user?.tenant?.name}</strong>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(true)} loading={refreshing}>
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats row — 5 cards, no duplicates */}
        <div className="responsive-grid-stats mb-6">
          {loading
            ? [...Array(5)].map((_, i) => <SkeletonStatCard key={i} />)
            : summary
            ? [
                {
                  label: "Today's Revenue",
                  value: formatCurrency(summary.todayRevenue),
                  icon: DollarSign,
                  accent: "green" as const,
                },
                {
                  label: "Today's Orders",
                  value: summary.todayOrders,
                  icon: ShoppingBag,
                  accent: "blue" as const,
                },
                {
                  label: "Active Orders",
                  value: summary.activeOrders,
                  icon: Activity,
                  accent: "orange" as const,
                },
                {
                  label: `Tables (${summary.occupiedTables} occ. / ${summary.availableTables} free)`,
                  value: `${summary.occupiedTables}/${summary.occupiedTables + summary.availableTables}`,
                  icon: Grid2X2,
                  accent: "purple" as const,
                },
                {
                  label: "Pending KOTs",
                  value: summary.pendingKots,
                  icon: ChefHat,
                  accent: "red" as const,
                },
              ].map((s) => <StatsCard key={s.label} {...s} />)
            : null}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Revenue chart */}
          <div className="content-card lg:col-span-3">
            <div className="content-card__header">
              <div>
                <p className="content-card__title">Hourly Revenue</p>
                <p className="content-card__subtitle">Today's breakdown by hour</p>
              </div>
              <div className="content-card__icon" style={{ background: "#fff7ed" }}>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="content-card__body">
              {hourly.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(h) => `${h}h`}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                      labelFormatter={(h) => `${h}:00 – ${Number(h) + 1}:00`}
                      contentStyle={{
                        fontSize: 12, borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                      }}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-2">
                  <TrendingUp className="w-10 h-10 text-gray-200" />
                  <p className="text-sm text-gray-400">No revenue data yet today</p>
                </div>
              )}
            </div>
          </div>

          {/* Top sellers */}
          <div className="content-card lg:col-span-2">
            <div className="content-card__header">
              <div>
                <p className="content-card__title">Top Sellers</p>
                <p className="content-card__subtitle">By quantity sold today</p>
              </div>
              <div className="content-card__icon" style={{ background: "#eff6ff" }}>
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="content-card__body" style={{ padding: "12px 20px" }}>
              {topItems.length > 0 ? (
                <ul>
                  {topItems.slice(0, 6).map((item, i) => {
                    const pct = Math.min(100, (item.total_qty / (topItems[0]?.total_qty ?? 1)) * 100);
                    return (
                      <li key={item.name} className="top-item-row">
                        <span className={`top-item-rank${i === 0 ? " top-item-rank--1" : ""}`}>
                          {i + 1}
                        </span>
                        <div className="progress-track min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                            {item.name}
                          </p>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ "--pct": `${pct}%` } as React.CSSProperties} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-gray-700 tabular-nums">{item.total_qty}×</p>
                          <p className="text-xs text-gray-400 tabular-nums">{formatCurrency(item.revenue)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-2">
                  <UtensilsCrossed className="w-10 h-10 text-gray-200" />
                  <p className="text-sm text-gray-400">No sales data yet</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
