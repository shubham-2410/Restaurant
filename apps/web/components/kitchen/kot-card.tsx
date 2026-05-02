"use client";
import { useEffect, useState } from "react";
import { Clock, Flame, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Kot, KotStatus } from "@restaurant/shared";
import { cn } from "@/lib/utils";

const statusConfig: Record<KotStatus, {
  border: string; bg: string; header: string; badge: string;
  nextLabel: string | null; nextStatus: string | null;
}> = {
  pending: {
    border: "border-amber-300", bg: "bg-white", header: "bg-amber-500", badge: "bg-amber-100 text-amber-700",
    nextLabel: "Start Preparing", nextStatus: "preparing",
  },
  preparing: {
    border: "border-blue-300", bg: "bg-white", header: "bg-blue-600", badge: "bg-blue-100 text-blue-700",
    nextLabel: "Mark Ready", nextStatus: "ready",
  },
  ready: {
    border: "border-emerald-400", bg: "bg-emerald-50", header: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-700",
    nextLabel: null, nextStatus: null,
  },
  cancelled: {
    border: "border-slate-200", bg: "bg-slate-50", header: "bg-slate-400", badge: "bg-slate-100 text-slate-500",
    nextLabel: null, nextStatus: null,
  },
};

function useElapsed(date: string) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return { label: "Just now", urgent: false };
  if (mins < 15) return { label: `${mins}m`, urgent: false };
  if (mins < 30) return { label: `${mins}m`, urgent: true };
  return { label: `${mins}m ⚠`, urgent: true };
}

interface KotCardProps {
  kot: Kot;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
  onTogglePriority: (id: number, isPriority: boolean) => Promise<void>;
  loading?: boolean;
}

export function KotCard({ kot, onUpdateStatus, onTogglePriority, loading }: KotCardProps) {
  const cfg = statusConfig[kot.status];
  const time = useElapsed(kot.createdAt);
  const tableName = kot.order?.table?.name;

  return (
    <div className={cn("border-2 rounded-2xl overflow-hidden shadow-sm", cfg.border, cfg.bg)}>
      {/* Header */}
      <div className={cn("px-4 py-2.5 flex items-center justify-between", cfg.header)}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-white text-sm">#{kot.id}</span>
          <span className="text-white/90 text-xs bg-white/20 px-2 py-0.5 rounded-full truncate">
            {tableName ?? "Takeaway"}
          </span>
          {kot.isPriority && (
            <span className="text-white text-xs bg-red-500/80 px-2 py-0.5 rounded-full font-bold">RUSH</span>
          )}
        </div>
        <button
          onClick={() => onTogglePriority(kot.id, !kot.isPriority)}
          title={kot.isPriority ? "Remove rush" : "Mark as rush"}
          className={cn(
            "p-1 rounded-lg transition-colors hover:bg-white/20",
            kot.isPriority ? "text-red-200" : "text-white/50 hover:text-white",
          )}
        >
          <Flame className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Timer */}
        <div className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold mb-3 px-2 py-1 rounded-lg",
          time.urgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500",
        )}>
          <Clock className="w-3 h-3" />
          {time.label}
        </div>

        {/* Items */}
        <ul className="space-y-2 mb-4">
          {kot.items?.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-800 leading-tight">{item.name}</span>
                {item.notes && (
                  <p className="text-xs text-slate-400 italic mt-0.5">"{item.notes}"</p>
                )}
              </div>
              <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                ×{item.quantity}
              </span>
            </li>
          ))}
          {!kot.items?.length && <li className="text-sm text-slate-400 italic">No items</li>}
        </ul>

        {/* Action */}
        {cfg.nextStatus && cfg.nextLabel ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onUpdateStatus(kot.id, cfg.nextStatus as string)}
            loading={loading}
          >
            {cfg.nextLabel}
          </Button>
        ) : kot.status === "ready" ? (
          <div className="flex items-center justify-center gap-2 py-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Ready to serve
          </div>
        ) : null}
      </div>
    </div>
  );
}
