"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api, createSseConnection } from "@/lib/api";
import type { Kot } from "@restaurant/shared";
import { KotCard } from "@/components/kitchen/kot-card";
import { ChefHat, Wifi, WifiOff, RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const columns = [
  { status: "pending"   as const, label: "Pending",   color: "text-amber-600",   dot: "bg-amber-400",  countBg: "bg-amber-100 text-amber-700" },
  { status: "preparing" as const, label: "Preparing",  color: "text-blue-600",    dot: "bg-blue-500",   countBg: "bg-blue-100 text-blue-700" },
  { status: "ready"     as const, label: "Ready ✓",   color: "text-emerald-600", dot: "bg-emerald-500", countBg: "bg-emerald-100 text-emerald-700" },
];

export default function KitchenPage() {
  const { error } = useToast();
  const [kots, setKots] = useState<Kot[]>([]);
  const [loadingKot, setLoadingKot] = useState<number | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const loadRef = useRef<() => Promise<void>>();

  const load = useCallback(async () => {
    try {
      const data = await api.kot.board();
      setKots(data.filter((k) => k.status !== "cancelled"));
      setLastRefresh(new Date());
    } catch {
      error("Failed to load kitchen board");
    }
  }, [error]);

  loadRef.current = load;

  useEffect(() => {
    load();
    const close = createSseConnection((data) => {
      const msg = data as { type: string };
      if (msg.type === "connected") setSseConnected(true);
      if (["kot_status", "order_created", "order_updated"].includes(msg.type)) {
        loadRef.current?.();
      }
    });
    const fallback = setInterval(() => { if (!sseConnected) loadRef.current?.(); }, 15_000);
    return () => { close(); clearInterval(fallback); };
  }, [load]);

  const updateStatus = async (id: number, status: string) => {
    setLoadingKot(id);
    try { await api.kot.updateStatus(id, status); await load(); }
    catch { error("Failed to update status"); }
    finally { setLoadingKot(null); }
  };

  const togglePriority = async (id: number, isPriority: boolean) => {
    try {
      await api.kot.setPriority(id, isPriority);
      setKots((prev) => prev.map((k) => k.id === id ? { ...k, isPriority } : k));
    } catch { error("Failed to update priority"); }
  };

  const totalActive = kots.filter((k) => k.status !== "ready").length;

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* KDS Header */}
        <div className="bg-slate-950 text-white px-5 py-3 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <ChefHat className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Kitchen Display System</h1>
              <p className="text-xs text-slate-400">
                {kots.length} KOTs total
                {totalActive > 0 && <span className="text-orange-400 font-semibold"> · {totalActive} active</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full",
              sseConnected ? "bg-emerald-900 text-emerald-400" : "bg-slate-800 text-slate-400",
            )}>
              {sseConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {sseConnected ? "Live" : "Polling"}
            </div>
            <button
              onClick={load}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KDS columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-3">
          {columns.map((col, colIdx) => {
            const colKots = kots.filter((k) => k.status === col.status);
            return (
              <div
                key={col.status}
                className={cn(
                  "flex flex-col overflow-hidden bg-slate-50",
                  colIdx < columns.length - 1 && "border-r border-slate-200",
                )}
              >
                {/* Column header */}
                <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-2.5 shrink-0">
                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", col.dot)} />
                  <span className={cn("font-bold text-sm", col.color)}>{col.label}</span>
                  <span className={cn("ml-auto text-xs font-bold px-2 py-0.5 rounded-full", col.countBg)}>
                    {colKots.length}
                  </span>
                </div>

                {/* KOT cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colKots.map((kot) => (
                    <KotCard
                      key={kot.id}
                      kot={kot}
                      onUpdateStatus={updateStatus}
                      onTogglePriority={togglePriority}
                      loading={loadingKot === kot.id}
                    />
                  ))}
                  {colKots.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                      <div className="text-3xl">
                        {col.status === "ready" ? "✅" : col.status === "preparing" ? "👨‍🍳" : "🍽️"}
                      </div>
                      <p className="text-sm text-slate-400 font-medium">No {col.label.replace(" ✓", "").toLowerCase()} orders</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
