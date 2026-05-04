"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { SkeletonCard } from "@/components/ui/spinner";
import { adminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { AdminPlatformStats } from "@restaurant/shared";
import { Store, TrendingUp, ShoppingBag, IndianRupee, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const [stats,      setStats]      = useState<AdminPlatformStats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await adminApi.stats.get();
      setStats(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-0.5">{dateStr}</p>
            <h1 className="text-2xl font-black text-slate-900">Platform Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Overview of all restaurants on RestaurantOS</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            loading={refreshing}
            className="shrink-0"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            <>
              <StatsCard
                label="Total Restaurants"
                value={stats.restaurants.total}
                icon={Store}
                iconColor="text-indigo-600"
                iconBg="bg-indigo-50"
                sub={`+${stats.restaurants.newThisMonth} this month`}
              />
              <StatsCard
                label="Active Restaurants"
                value={stats.restaurants.active}
                icon={CheckCircle2}
                iconColor="text-emerald-600"
                iconBg="bg-emerald-50"
              />
              <StatsCard
                label="Orders Today"
                value={stats.today.orders}
                icon={ShoppingBag}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
                sub="across all restaurants"
              />
              <StatsCard
                label="Revenue Today"
                value={formatCurrency(stats.today.revenue)}
                icon={IndianRupee}
                iconColor="text-orange-600"
                iconBg="bg-orange-50"
                sub={`All-time: ${formatCurrency(stats.allTime.revenue)}`}
              />
            </>
          ) : null}
        </div>

        {/* Restaurant status breakdown */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-700 tabular-nums">{stats.restaurants.active}</p>
                <p className="text-sm font-medium text-emerald-600">Active Restaurants</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-red-600 tabular-nums">{stats.restaurants.inactive}</p>
                <p className="text-sm font-medium text-red-500">Inactive / Suspended</p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly revenue chart */}
        {stats && stats.monthlyRevenue.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-slate-900">Platform Revenue</h2>
                <p className="text-xs text-slate-400 mt-0.5">Monthly — last 6 months</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.monthlyRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
