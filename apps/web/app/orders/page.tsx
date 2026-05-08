"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { api, createSseConnection } from "@/lib/api";
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
  const loadRef = useRef<() => Promise<void>>();

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrders(await api.orders.list()); }
    catch { error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [error]);

  loadRef.current = load;

  useEffect(() => {
    load();

    /* SSE for real-time sync — kitchen status changes immediately reflect here */
    const closeSSE = createSseConnection((data) => {
      const msg = data as { type: string };
      if (["order_created", "order_updated", "kot_status"].includes(msg.type)) {
        loadRef.current?.();
      }
    });

    /* Fallback poll every 15s in case SSE drops */
    const poll = setInterval(() => { loadRef.current?.(); }, 15_000);

    return () => { closeSSE(); clearInterval(poll); };
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

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

        {/* Header */}
        <div className="border-b shrink-0"
          style={{ background: "var(--surface)", borderColor: "var(--bdr)", padding: "16px 20px 14px" }}>
          <div className="page-header" style={{ marginBottom: 14 }}>
            <div>
              <h1 className="page-title">
                <span className="page-title-bar" />
                Orders
              </h1>
              <p className="page-subtitle" style={{ paddingLeft: 13 }}>
                {orders.length} total today
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} loading={loading}>
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          {/* Search + filter tabs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "var(--text-faint)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order #, table, item…"
                className="w-full sm:w-60 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                style={{
                  border: "1px solid var(--bdr)",
                  borderRadius: "var(--r-md)",
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
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

        {/* Grid */}
        <div className="flex-1 overflow-y-auto page-section pt-5">
          {loading && filtered.length === 0 ? (
            <div className="responsive-grid-orders">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border rounded-lg p-4" style={{ borderColor: "var(--bdr)" }}>
                  <div className="flex gap-3 mb-3">
                    <div className="skeleton w-8 h-8 rounded-lg" />
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
                const cfg       = statusCfg[order.status] ?? statusCfg.pending;
                const TypeIcon  = typeIcon[order.orderType] ?? UtensilsCrossed;
                const statusCls = orderCardStatus[order.status] ?? "";
                const waiterName = (order as Order & { user?: { name: string } }).user?.name;
                return (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className={`order-card ${statusCls}`}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-2.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                          style={{ background: "var(--surface-3)" }}>
                          <TypeIcon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>#{order.id}</p>
                          <p className="text-xs capitalize" style={{ color: "var(--text-faint)" }}>
                            {order.table ? order.table.name : order.orderType.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                    </div>

                    {/* Items preview */}
                    <p className="text-xs mb-3 line-clamp-1 text-left pl-2"
                      style={{ color: "var(--text-faint)" }}>
                      {order.items?.map((i) => i.name).join(", ") ?? "No items"}
                    </p>

                    {/* Footer */}
                    <div className="flex items-end justify-between pl-2">
                      <div className="text-left">
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{order.items?.length ?? 0} items</p>
                        <p className="text-lg font-bold tabular-nums leading-tight"
                          style={{ color: "var(--text-primary)" }}>
                          {formatCurrency(parseFloat(order.total))}
                        </p>
                      </div>
                      <div className="text-right">
                        {waiterName && (
                          <p className="text-xs mb-0.5" style={{ color: "var(--text-faint)" }}>
                            👤 {waiterName.split(" ")[0]}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-faint)" }}>
                          <Clock className="w-3 h-3" />
                          {elapsed(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-semibold pl-2"
                      style={{ borderColor: "var(--bdr-light)", color: "var(--brand)" }}>
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
