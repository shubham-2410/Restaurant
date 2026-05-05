"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@restaurant/shared";
import { ShoppingBag, RefreshCcw, UtensilsCrossed, Package, Truck, ArrowRight, Clock, Search } from "lucide-react";
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
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function OrdersPage() {
  const router = useRouter();
  const { error } = useToast();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<string>("active");
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrders(await api.orders.list()); }
    catch { error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [error]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const tabs = [
    { key: "active",    label: "Active",    count: orders.filter((o) => !["cancelled","billed"].includes(o.status)).length },
    { key: "billed",    label: "Billed",    count: orders.filter((o) => o.status === "billed").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
    { key: "all",       label: "All",       count: orders.length },
  ];

  const filtered = orders
    .filter((o) => {
      if (filter === "active")    return !["cancelled","billed"].includes(o.status);
      if (filter === "billed")    return o.status === "billed";
      if (filter === "cancelled") return o.status === "cancelled";
      return true;
    })
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(o.id).includes(q) ||
        o.table?.name?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.name.toLowerCase().includes(q))
      );
    });

  return (
    <AppLayout>
      <div className="h-full flex flex-col">

        {/* ── Sticky header ── */}
        <div className="bg-white border-b border-gray-200 px-5 py-4 shrink-0 shadow-sm">
          <div className="page-header" style={{ marginBottom: "14px" }}>
            <div>
              <h1 className="page-title">
                <span className="page-title-bar" />
                Orders
              </h1>
              <p className="page-subtitle" style={{ paddingLeft: "13px" }}>
                {orders.length} total today
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} loading={loading}>
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>

          {/* Search + Tabs row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order #, table, item…"
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Filter tabs */}
            <div className="filter-tabs flex-1 flex-wrap">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`filter-tab${filter === t.key ? " filter-tab--active" : ""}`}
                >
                  {t.label}
                  <span className="filter-tab__badge">{t.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Cards grid ── */}
        <div className="flex-1 overflow-y-auto page-section pt-5">
          {loading && filtered.length === 0 ? (
            <div className="responsive-grid-orders">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="skeleton w-8 h-8 rounded-xl" />
                    <div className="flex-1">
                      <div className="skeleton h-4 rounded w-1/3 mb-1" />
                      <div className="skeleton h-3 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="skeleton h-3 rounded w-3/4 mb-4" />
                  <div className="skeleton h-6 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={search ? "No matching orders" : "No orders here"}
              description={search ? `No results for "${search}"` : "Orders placed from the POS will appear here."}
            />
          ) : (
            <div className="responsive-grid-orders">
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
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-2.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <TypeIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900 text-sm leading-tight">#{order.id}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {order.table
                              ? order.table.name
                              : order.orderType.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                    </div>

                    {/* Items preview */}
                    <p className="text-xs text-gray-400 mb-3 line-clamp-1 text-left pl-2">
                      {order.items?.map((i) => i.name).join(", ") ?? "No items"}
                    </p>

                    {/* Footer */}
                    <div className="flex items-end justify-between pl-2">
                      <div className="text-left">
                        <p className="text-xs text-gray-400">{order.items?.length ?? 0} items</p>
                        <p className="text-lg font-bold text-gray-900 tabular-nums leading-tight">
                          {formatCurrency(parseFloat(order.total))}
                        </p>
                      </div>
                      <div className="text-right">
                        {waiterName && (
                          <p className="text-xs text-gray-400 mb-0.5">👤 {waiterName.split(" ")[0]}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {elapsed(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-orange-500 font-semibold pl-2">
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
