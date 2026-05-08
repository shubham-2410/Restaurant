"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Bill, Order } from "@restaurant/shared";
import {
  Receipt, Printer, Search, CreditCard,
  CheckCircle2, UtensilsCrossed, Package, Truck,
  ArrowRight, RefreshCcw, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaymentModal } from "@/components/billing/payment-modal";
import { PrintBill, triggerPrint } from "@/components/billing/print-bill";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const orderTypeIcon: Record<string, typeof UtensilsCrossed> = {
  dine_in: UtensilsCrossed, takeaway: Package, delivery: Truck,
};

const orderStatusStyle: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-blue-100 text-blue-700 border-blue-200",
  ready:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  served:    "bg-purple-100 text-purple-700 border-purple-200",
};

function elapsed(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [unbilledOrders, setUnbilledOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<{ bill?: Bill; order?: Order } | null>(null);
  const [printBill, setPrintBill] = useState<Bill | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [billData, pendingData] = await Promise.all([
        api.billing.list(),
        api.billing.pendingOrders(),
      ]);
      setBills(billData);
      setUnbilledOrders(pendingData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const afterPaid = useCallback(() => load(false), [load]);

  const filteredBills = bills.filter((b) =>
    !search ||
    b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
    (b.order?.table?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const unpaidBills = bills.filter((b) => b.paymentStatus === "pending");
  const paidToday   = bills.filter((b) => {
    if (!b.paidAt) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(b.paidAt) >= today;
  });

  return (
    <AppLayout>
      <div className="h-full flex flex-col">

        {/* Header */}
        <div className="border-b shrink-0 px-5 py-4"
          style={{ background: "var(--surface)", borderColor: "var(--bdr)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title mb-1">
                <span className="page-title-bar" />
                Billing &amp; Payments
              </h1>
              <div className="flex items-center gap-3 pl-3.5 flex-wrap">
                {unbilledOrders.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: "var(--brand)", background: "var(--brand-light)", border: "1px solid var(--brand-mid)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--brand)" }} />
                    {unbilledOrders.length} ready to checkout
                  </span>
                )}
                {unpaidBills.length > 0 && (
                  <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: "var(--danger)", background: "var(--danger-light)", border: "1px solid #FECACA" }}>
                    {unpaidBills.length} unpaid
                  </span>
                )}
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>{paidToday.length} paid today</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => load(true)} loading={refreshing} className="shrink-0">
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Ready to checkout */}
          {unbilledOrders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand)" }} />
                Ready to Checkout ({unbilledOrders.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {unbilledOrders.map((order) => {
                  const TypeIcon = orderTypeIcon[order.orderType] ?? UtensilsCrossed;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setCheckoutTarget({ order })}
                      className="group text-left transition-all active:scale-[0.97] rounded-lg overflow-hidden"
                      style={{
                        background: "var(--surface)",
                        border: "1.5px solid var(--bdr)",
                        padding: "14px",
                        borderRadius: "var(--r-lg)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ background: "var(--brand-light)", borderRadius: "var(--r-sm)" }}>
                          <TypeIcon className="w-4 h-4" style={{ color: "var(--brand)" }} />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize",
                          orderStatusStyle[order.status] ?? "bg-slate-100 text-slate-500 border-slate-200",
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <p className="font-black text-sm leading-tight truncate" style={{ color: "var(--text-primary)" }}>
                        {order.table ? order.table.name : order.orderType.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-xs mb-2" style={{ color: "var(--text-faint)" }}>
                        #{order.id} · {order.items?.length ?? 0} items
                      </p>
                      <p className="text-base font-black tabular-nums" style={{ color: "var(--brand)" }}>
                        {formatCurrency(parseFloat(order.total))}
                      </p>
                      <div className="mt-2 pt-2 border-t flex items-center justify-between text-[10px]"
                        style={{ borderColor: "var(--bdr-light)", color: "var(--text-faint)" }}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {elapsed(order.createdAt)}
                        </span>
                        <span className="font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                          style={{ color: "var(--brand)" }}>
                          Pay <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Unpaid bills */}
          {unpaidBills.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Pending Bills ({unpaidBills.length})
              </h2>
              <div className="space-y-2">
                {unpaidBills.map((bill) => (
                  <div key={bill.id} className="flex items-center gap-4 px-4 py-3 rounded-lg"
                    style={{ background: "var(--surface)", border: "1px solid #FECACA", borderRadius: "var(--r-lg)" }}>
                    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      style={{ background: "#FEF2F2", borderRadius: "var(--r-sm)" }}>
                      <Receipt className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{bill.billNumber}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>
                        {bill.order?.table?.name ?? bill.order?.orderType?.replace("_", " ") ?? "—"}
                        {" · "}{bill.order?.items?.length ?? 0} items
                      </p>
                    </div>
                    <p className="font-black tabular-nums text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(parseFloat(bill.total))}
                    </p>
                    <Button variant="primary" size="sm" onClick={() => setCheckoutTarget({ bill })} className="shrink-0">
                      <CreditCard className="w-3.5 h-3.5" /> Collect
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bill history */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--bdr-strong)" }} />
                Bill History
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: "var(--text-faint)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bill / table…"
                  className="pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                  style={{
                    border: "1px solid var(--bdr)",
                    borderRadius: "var(--r-md)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg animate-pulse"
                    style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }} />
                ))}
              </div>
            ) : filteredBills.length === 0 ? (
              <EmptyState icon={Receipt} title="No bills yet" description="Bills appear here once you checkout an order." />
            ) : (
              <div className="rounded-lg overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[680px]">
                    <thead>
                      <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--bdr)" }}>
                        {["Bill No.", "Table/Type", "Items", "Subtotal", "GST", "Disc.", "Total", "Method", "Status", ""].map((h) => (
                          <th key={h} className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: "var(--text-faint)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill, i) => (
                        <tr key={bill.id}
                          className="transition-colors hover:bg-blue-50"
                          style={{ borderBottom: i < filteredBills.length - 1 ? `1px solid var(--bdr-light)` : "none" }}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
                              <span className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>{bill.billNumber}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                            {bill.order?.table?.name ?? bill.order?.orderType?.replace("_", " ") ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-xs" style={{ color: "var(--text-faint)" }}>
                            {bill.order?.items?.length ?? 0}
                          </td>
                          <td className="px-3 py-3 tabular-nums text-xs" style={{ color: "var(--text-secondary)" }}>
                            {formatCurrency(parseFloat(bill.subtotal))}
                          </td>
                          <td className="px-3 py-3 tabular-nums text-xs" style={{ color: "var(--text-faint)" }}>
                            {formatCurrency(parseFloat(bill.gstAmount))}
                          </td>
                          <td className="px-3 py-3 tabular-nums text-xs" style={{ color: "var(--success)" }}>
                            {parseFloat(bill.discount) > 0
                              ? `−${formatCurrency(parseFloat(bill.discount))}`
                              : <span style={{ color: "var(--bdr-strong)" }}>—</span>
                            }
                          </td>
                          <td className="px-3 py-3 font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
                            {formatCurrency(parseFloat(bill.total))}
                          </td>
                          <td className="px-3 py-3 capitalize text-xs" style={{ color: "var(--text-muted)" }}>
                            {bill.paymentMethod?.replace("_", " ") ?? "—"}
                          </td>
                          <td className="px-3 py-3">
                            {bill.paymentStatus === "paid" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap"
                                style={{ color: "var(--success)", background: "var(--success-light)", border: "1px solid #A7F3D0" }}>
                                <CheckCircle2 className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <Badge variant={bill.paymentStatus === "pending" ? "warning" : "default"} dot>
                                {bill.paymentStatus.replace("_", " ")}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {bill.paymentStatus === "pending" && (
                                <Button variant="primary" size="sm" onClick={() => setCheckoutTarget({ bill })}>
                                  Collect
                                </Button>
                              )}
                              <button
                                onClick={() => { setPrintBill(bill); setTimeout(() => triggerPrint(), 200); }}
                                className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-blue-50"
                                style={{ color: "var(--text-faint)", borderRadius: "var(--r-sm)" }}
                                title="Print"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {checkoutTarget && (
        <PaymentModal
          open={!!checkoutTarget}
          onClose={() => setCheckoutTarget(null)}
          onPaid={afterPaid}
          bill={checkoutTarget.bill}
          order={checkoutTarget.order}
        />
      )}
      {printBill && (
        <PrintBill
          bill={printBill}
          restaurantName={user?.tenant?.name ?? "Restaurant"}
          gstNumber={user?.tenant?.gstNumber}
          address={user?.tenant?.address}
          phone={user?.tenant?.phone}
        />
      )}
    </AppLayout>
  );
}
