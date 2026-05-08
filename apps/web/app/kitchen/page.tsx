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
  { status: "pending"   as const, label: "Pending",   color: "text-amber-600",   dot: "bg-amber-400",   countBg: "bg-amber-100 text-amber-700" },
  { status: "preparing" as const, label: "Preparing",  color: "text-blue-600",    dot: "bg-blue-500",    countBg: "bg-blue-100 text-blue-700" },
  { status: "ready"     as const, label: "Ready ✓",    color: "text-emerald-600", dot: "bg-emerald-500", countBg: "bg-emerald-100 text-emerald-700" },
];

export default function KitchenPage() {
  const { error } = useToast();
  const [kots,        setKots]        = useState<Kot[]>([]);
  const [loadingKot,  setLoadingKot]  = useState<number | null>(null);
  const [sseConnected,setSseConnected]= useState(false);
  const loadRef = useRef<() => Promise<void>>();

  const load = useCallback(async () => {
    try {
      const data = await api.kot.board();
      setKots(data.filter((k) => k.status !== "cancelled"));
    } catch { error("Failed to load kitchen board"); }
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
    /* Fallback poll when SSE disconnects */
    const fallback = setInterval(() => { if (!sseConnected) loadRef.current?.(); }, 15_000);
    return () => { close(); clearInterval(fallback); };
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

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

        {/* KDS Header — dark surface with brand accent */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0"
          style={{ background: "#0F172A", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(37,99,235,.25)", border: "1px solid rgba(37,99,235,.35)" }}>
              <ChefHat className="w-4 h-4" style={{ color: "#93C5FD" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Kitchen Display</p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                {kots.length} KOTs
                {totalActive > 0 && (
                  <span style={{ color: "#60A5FA", fontWeight: 600 }}> · {totalActive} active</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded",
              sseConnected
                ? "text-emerald-400"
                : "text-slate-500",
            )}
              style={{ background: sseConnected ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.05)" }}
            >
              {sseConnected
                ? <Wifi className="w-3 h-3" />
                : <WifiOff className="w-3 h-3" />
              }
              {sseConnected ? "Live" : "Polling"}
            </div>
            <button
              onClick={load}
              className="p-1.5 rounded transition-colors"
              style={{ color: "#64748B" }}
              title="Refresh"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Kanban columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-3" style={{ background: "var(--page-bg)" }}>
          {columns.map((col, colIdx) => {
            const colKots = kots.filter((k) => k.status === col.status);
            return (
              <div
                key={col.status}
                className="flex flex-col overflow-hidden"
                style={{
                  background: col.status === "preparing" ? "#F8FAFF" : "var(--page-bg)",
                  borderRight: colIdx < columns.length - 1 ? "1px solid var(--bdr)" : "none",
                }}
              >
                {/* Column header */}
                <div className="px-3 py-2.5 border-b flex items-center gap-2 shrink-0"
                  style={{ background: "var(--surface)", borderColor: "var(--bdr)" }}>
                  <span className={cn("w-2 h-2 rounded-full shrink-0", col.dot)} />
                  <span className={cn("font-bold text-sm", col.color)}>{col.label}</span>
                  <span className={cn("ml-auto text-xs font-bold px-1.5 py-0.5 rounded", col.countBg)}>
                    {colKots.length}
                  </span>
                </div>

                {/* KOT cards */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
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
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                      <span className="text-2xl select-none">
                        {col.status === "ready" ? "✅" : col.status === "preparing" ? "👨‍🍳" : "🍽️"}
                      </span>
                      <p className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
                        No {col.label.replace(" ✓", "").toLowerCase()} orders
                      </p>
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
