"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary } from "@restaurant/shared";
import { DollarSign, ShoppingBag, Table, ChefHat } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.dashboard.summary().then(setSummary).catch(() => {});
  }, []);

  const stats = summary ? [
    { label: "Today's Revenue", value: formatCurrency(summary.todayRevenue), icon: DollarSign, color: "text-green-600" },
    { label: "Today's Orders", value: summary.todayOrders, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Active Orders", value: summary.activeOrders, icon: ShoppingBag, color: "text-orange-600" },
    { label: "Tables Occupied", value: `${summary.occupiedTables}/${summary.occupiedTables + summary.availableTables}`, icon: Table, color: "text-purple-600" },
    { label: "Pending KOTs", value: summary.pendingKots, icon: ChefHat, color: "text-red-600" },
  ] : [];

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-slate-500 mb-8">Today's operations overview</p>
        {summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500">{s.label}</span>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-8 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
