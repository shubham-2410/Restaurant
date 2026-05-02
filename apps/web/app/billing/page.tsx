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
  dine_in:  UtensilsCrossed,
  takeaway: Package,
  delivery: Truck,
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

  // After payment, always fully reload so stale orders disappear
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
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                <h1 className="text-xl font-black text-slate-900">Billing & Payments</h1>
              </div>
              <div className="flex items-center gap-3 pl-3.5 flex-wrap">
                {unbilledOrders.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    {unbilledOrders.length} ready to checkout
                  </span>
                )}
                {unpaidBills.length > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    {unpaidBills.length} unpaid
                  </span>
                )}
                <span className="text-xs text-slate-400">{paidToday.length} paid today</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => load(true)} loading={refreshing} className="shrink-0">
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ── Active orders ready to checkout ─────────────────────────────── */}
          {unbilledOrders.length > 0 && (
            <section>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Ready to Checkout ({unbilledOrders.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {unbilledOrders.map((order) => {
                  const TypeIcon = orderTypeIcon[order.orderType] ?? UtensilsCrossed;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setCheckoutTarget({ order })}
                      className="group bg-white border-2 border-slate-200 hover:border-orange-400 rounded-2xl p-3.5 text-left transition-all hover:shadow-lg hover:shadow-orange-100 active:scale-[0.97]"
                    >
                      {/* Type + status */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
                          <TypeIcon className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full border capitalize",
                          orderStatusStyle[order.status] ?? "bg-slate-100 text-slate-500 border-slate-200",
                        )}>
                          {order.status}
                        </span>
                      </div>

                      {/* Table / type */}
                      <p className="font-black text-slate-900 text-sm leading-tight truncate">
                        {order.table ? order.table.name : order.orderType.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-400 mb-2">
                        #{order.id} · {order.items?.length ?? 0} items
                      </p>

                      {/* Total */}
                      <p className="text-base font-black text-orange-500 tabular-nums">
                        {formatCurrency(parseFloat(order.total))}
                      </p>

                      {/* Elapsed */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {elapsed(order.createdAt)}
                        </span>
                        <span className="text-orange-400 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                          Pay <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Unpaid generated bills ──────────────────────────────────────── */}
          {unpaidBills.length > 0 && (
            <section>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Pending Bills ({unpaidBills.length})
              </h2>
              <div className="space-y-2">
                {unpaidBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="bg-white border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{bill.billNumber}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {bill.order?.table?.name ?? bill.order?.orderType?.replace("_", " ") ?? "—"}
                        {" · "}{bill.order?.items?.length ?? 0} items
                      </p>
                    </div>
                    <p className="font-black text-slate-900 tabular-nums text-sm shrink-0">
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

          {/* ── All bills history ───────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Bill History
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bill / table…"
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-2xl h-14 animate-pulse" />
                ))}
              </div>
            ) : filteredBills.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No bills yet"
                description="Bills appear here once you checkout an order."
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[680px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Bill No.", "Table/Type", "Items", "Subtotal", "GST", "Disc.", "Total", "Method", "Status", ""].map((h) => (
                          <th key={h} className="px-3 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-900 text-xs">{bill.billNumber}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600 text-xs">
                            {bill.order?.table?.name ?? bill.order?.orderType?.replace("_", " ") ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-slate-400 text-xs">{bill.order?.items?.length ?? 0}</td>
                          <td className="px-3 py-3 tabular-nums text-xs">{formatCurrency(parseFloat(bill.subtotal))}</td>
                          <td className="px-3 py-3 tabular-nums text-xs text-slate-400">{formatCurrency(parseFloat(bill.gstAmount))}</td>
                          <td className="px-3 py-3 tabular-nums text-xs text-emerald-600">
                            {parseFloat(bill.discount) > 0 ? `−${formatCurrency(parseFloat(bill.discount))}` : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-3 py-3 font-black tabular-nums text-slate-900">{formatCurrency(parseFloat(bill.total))}</td>
                          <td className="px-3 py-3 capitalize text-slate-500 text-xs">{bill.paymentMethod?.replace("_", " ") ?? "—"}</td>
                          <td className="px-3 py-3">
                            {bill.paymentStatus === "paid" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
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
                                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
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
