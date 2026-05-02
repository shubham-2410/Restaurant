"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import type { Kot } from "@restaurant/shared";
import { Clock, AlertTriangle } from "lucide-react";

const statusColors = {
  pending: "border-yellow-400 bg-yellow-50",
  preparing: "border-blue-400 bg-blue-50",
  ready: "border-green-400 bg-green-50",
  cancelled: "border-slate-300 bg-slate-50 opacity-50",
};

function elapsed(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  return mins < 1 ? "Just now" : `${mins}m ago`;
}

export default function KitchenPage() {
  const [kots, setKots] = useState<Kot[]>([]);

  const load = () => api.kot.board().then((k) => setKots(k.filter((kot) => kot.status !== "cancelled"))).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 15_000); return () => clearInterval(t); }, []);

  const updateStatus = async (id: number, status: string) => {
    await api.kot.updateStatus(id, status);
    load();
  };

  const active = kots.filter((k) => k.status !== "ready");
  const ready = kots.filter((k) => k.status === "ready");

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Kitchen Display</h1>
          <button onClick={load} className="text-sm text-slate-500 hover:text-slate-900">Refresh</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Pending ({active.filter(k => k.status === "pending").length})
            </h2>
            <div className="space-y-3">
              {active.filter(k => k.status === "pending").map((kot) => <KotCard key={kot.id} kot={kot} onUpdate={updateStatus} />)}
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Preparing ({active.filter(k => k.status === "preparing").length})
            </h2>
            <div className="space-y-3">
              {active.filter(k => k.status === "preparing").map((kot) => <KotCard key={kot.id} kot={kot} onUpdate={updateStatus} />)}
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Ready ({ready.length})
            </h2>
            <div className="space-y-3">
              {ready.map((kot) => <KotCard key={kot.id} kot={kot} onUpdate={updateStatus} />)}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function KotCard({ kot, onUpdate }: { kot: Kot; onUpdate: (id: number, status: string) => void }) {
  const nextStatus = { pending: "preparing", preparing: "ready" } as Record<string, string>;
  return (
    <div className={`border-2 rounded-xl p-4 ${statusColors[kot.status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-slate-900">KOT #{kot.id}</span>
        {kot.isPriority && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
        <Clock className="w-3 h-3" /> {elapsed(kot.createdAt)}
      </div>
      <ul className="space-y-1 mb-3">
        {kot.items?.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span>{item.name}</span>
            <span className="font-medium">×{item.quantity}</span>
          </li>
        ))}
      </ul>
      {nextStatus[kot.status] && (
        <button
          onClick={() => onUpdate(kot.id, nextStatus[kot.status])}
          className="w-full py-1.5 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
        >
          Mark {nextStatus[kot.status]}
        </button>
      )}
    </div>
  );
}
