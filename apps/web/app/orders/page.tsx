"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@restaurant/shared";
import { ShoppingBag, RefreshCcw, UtensilsCrossed, Package, Truck, ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

const statusCfg: Record<string, { label: string; variant: "pending"|"preparing"|"ready"|"cancelled"|"paid"|"default" }> = {
  pending:   { label: "Pending",   variant: "pending"   },
  confirmed: { label: "Confirmed", variant: "preparing" },
  preparing: { label: "Preparing", variant: "preparing" },
  ready:     { label: "Ready",     variant: "ready"     },
  served:    { label: "Served",    variant: "ready"     },
  billed:    { label: "Billed",    variant: "paid"      },
  cancelled: { label: "Cancelled", variant: "cancelled" },
};

const orderCardStatus: Record<string, string> = {
  pending:   "order-card--pending",
  confirmed: "order-card--preparing",
  preparing: "order-card--preparing",
  ready:     "order-card--ready",
  served:    "order-card--served",
  billed:    "order-card--billed",
  cancelled: "order-card--cancelled",
};

const typeIcon: Record<string, typeof UtensilsCrossed> = {
  dine_in: UtensilsCrossed, takeaway: Package, delivery: Truck,
};

function elapsed(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function OrdersPage() {
  const router = useRouter();
  const { error } = useToast();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<string>("active");

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrders(await api.orders.list()); }
    catch { error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [error]);

  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  const tabs = [
    { key: "active",    label: "Active",    count: orders.filter((o) => !["cancelled","billed"].includes(o.status)).length },
    { key: "billed",    label: "Billed",    count: orders.filter((o) => o.status === "billed").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
    { key: "all",       label: "All",       count: orders.length },
  ];

  const filtered = orders.filter((o) => {
    if (filter === "active")    return !["cancelled","billed"].includes(o.status);
    if (filter === "billed")    return o.status === "billed";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="page-header" style={{ marginBottom: "14px" }}>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <span className="section-bar" />
                Orders
              </h1>
              <p className="page-subtitle pl-4">{orders.length} total</p>
            </div>
            <Button variant="outline" size="sm" onClick={load} loading={loading}>
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
          <div className="filter-tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`filter-tab${filter === t.key ? " filter-tab--active" : ""}`}
              >
                {t.label}
                <span className="filter-tab__count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && filtered.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                  <div className="h-6 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders" description="Orders placed from the POS will appear here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((order) => {
                const cfg      = statusCfg[order.status] ?? statusCfg.pending;
                const TypeIcon = typeIcon[order.orderType] ?? UtensilsCrossed;
                const statusClass = orderCardStatus[order.status] ?? "";
                const waiterName  = (order as Order & { user?: { name: string } }).user?.name;
                return (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className={`order-card ${statusClass}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <TypeIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">#{order.id}</p>
                          <p className="text-xs text-slate-400">
                            {order.table ? order.table.name : order.orderType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 line-clamp-1 text-left">
                      {order.items?.map((i) => i.name).join(", ") ?? "No items"}
                    </p>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{order.items?.length ?? 0} items</p>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(parseFloat(order.total))}</p>
                      </div>
                      <div className="text-right">
                        {waiterName && <p className="text-xs text-slate-400 mb-0.5">👤 {waiterName.split(" ")[0]}</p>}
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />{elapsed(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-orange-500 font-semibold">
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
