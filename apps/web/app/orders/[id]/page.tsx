"use client";
import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Order, User, Bill } from "@restaurant/shared";
import {
  ArrowLeft, Receipt, Printer, Clock, UtensilsCrossed,
  CheckCircle2, XCircle, Truck, ChefHat, CreditCard,
  UserCircle, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { FoodTypeDot } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { PrintBill, triggerPrint } from "@/components/billing/print-bill";
import { PaymentModal } from "@/components/billing/payment-modal";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; badgeVariant: "pending" | "preparing" | "ready" | "cancelled" | "paid" | "default"; icon: typeof Clock }> = {
  pending:   { label: "Pending",   badgeVariant: "pending",   icon: Clock },
  confirmed: { label: "Confirmed", badgeVariant: "preparing", icon: CheckCircle2 },
  preparing: { label: "Preparing", badgeVariant: "preparing", icon: ChefHat },
  ready:     { label: "Ready",     badgeVariant: "ready",     icon: CheckCircle2 },
  served:    { label: "Served",    badgeVariant: "ready",     icon: UtensilsCrossed },
  billed:    { label: "Billed",    badgeVariant: "paid",      icon: Receipt },
  cancelled: { label: "Cancelled", badgeVariant: "cancelled", icon: XCircle },
};

const statusFlow: Record<string, { label: string; next: string }> = {
  pending:   { label: "Confirm Order",   next: "confirmed" },
  confirmed: { label: "Start Preparing", next: "preparing" },
  preparing: { label: "Mark Ready",      next: "ready" },
  ready:     { label: "Mark Served",     next: "served" },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [voidLoading, setVoidLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [printBillData, setPrintBillData] = useState<Bill | null>(null);
  const [showWaiterDrop, setShowWaiterDrop] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [o, staffList, allBills] = await Promise.all([
        api.orders.get(parseInt(id)),
        api.users.list(),
        api.billing.list(),
      ]);
      setOrder(o);
      setStaff(staffList.filter((u) => u.isActive));
      const existing = allBills.find((b) => b.orderId === o.id) ?? null;
      setBill(existing);
    } catch { error("Failed to load order"); }
    finally { setLoading(false); }
  }, [id, error]);

  useEffect(() => { load(); }, [load]);

  const advanceStatus = async () => {
    if (!order) return;
    const next = statusFlow[order.status]?.next;
    if (!next) return;
    setStatusLoading(true);
    try {
      await api.orders.update(order.id, { status: next });
      success(`Order marked as ${next}`);
      await load();
    } catch { error("Failed to update order"); }
    finally { setStatusLoading(false); }
  };

  const voidOrder = async () => {
    if (!order || !confirm("Void this order? This cannot be undone.")) return;
    setVoidLoading(true);
    try {
      await api.orders.void(order.id);
      success("Order voided");
      router.push("/orders");
    } catch { error("Failed to void order"); }
    finally { setVoidLoading(false); }
  };

  const assignWaiter = async (userId: number) => {
    if (!order) return;
    try {
      await api.orders.assignWaiter(order.id, userId);
      setShowWaiterDrop(false);
      success("Waiter assigned");
      await load();
    } catch { error("Failed to assign waiter"); }
  };

  const handlePrint = () => {
    if (!bill) return;
    setPrintBillData(bill);
    setTimeout(() => triggerPrint(), 200);
  };

  if (loading) return <AppLayout><PageLoader text="Loading order…" /></AppLayout>;
  if (!order)  return <AppLayout><div className="p-8 text-slate-400 text-sm">Order not found</div></AppLayout>;

  const cfg = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;
  const nextStep = statusFlow[order.status];
  const canVoid = !["cancelled", "billed"].includes(order.status);
  const canBillOrPay = !["cancelled"].includes(order.status);
  const subtotal = parseFloat(order.subtotal);
  const gst      = parseFloat(order.gstAmount);
  const total    = parseFloat(order.total);

  // Waiter = userId on the order
  const assignedWaiter = staff.find((u) => u.id === (order as Order & { user?: User }).user?.id ?? order.userId);

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto bg-slate-50">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-black text-slate-900">Order #{order.id}</h1>
              <Badge variant={cfg.badgeVariant} dot>
                <StatusIcon className="w-3 h-3 mr-0.5" />
                {cfg.label}
              </Badge>
              {order.table && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  🪑 {order.table.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bill && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            )}
            {canBillOrPay && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPayment(true)}
                className="gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {bill?.paymentStatus === "paid" ? "Paid ✓" : bill ? "Collect Payment" : "Checkout"}
              </Button>
            )}
            {canVoid && (
              <Button variant="danger" size="sm" onClick={voidOrder} loading={voidLoading}>
                <XCircle className="w-3.5 h-3.5" /> Void
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Items card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {order.items?.length ?? 0} Items
              </h2>
              <span className="text-xs text-slate-400 capitalize">
                {order.orderType.replace("_", " ")}
              </span>
            </div>

            <div>
              {order.items?.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    "px-5 py-4 flex items-start gap-3",
                    i < (order.items?.length ?? 0) - 1 && "border-b border-slate-50",
                  )}
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-slate-500">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm leading-tight">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-slate-400 italic mt-0.5">"{item.notes}"</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(parseFloat(item.price))} each</p>
                  </div>
                  <span className="font-bold text-slate-900 text-sm tabular-nums shrink-0">
                    {formatCurrency(parseFloat(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-orange-50/30 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>GST</span><span className="tabular-nums">{formatCurrency(gst)}</span>
              </div>
              {bill && parseFloat(bill.discount) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Discount</span><span className="tabular-nums">−{formatCurrency(parseFloat(bill.discount))}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 text-xl pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="tabular-nums text-orange-600">
                  {bill ? formatCurrency(parseFloat(bill.total)) : formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Status action */}
            {nextStep && !["cancelled", "billed"].includes(order.status) && (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-orange-200">
                <p className="text-xs font-bold opacity-75 mb-1">NEXT STEP</p>
                <p className="text-sm font-semibold mb-3 opacity-90">Move order to next stage</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold"
                  onClick={advanceStatus}
                  loading={statusLoading}
                >
                  {nextStep.label} →
                </Button>
              </div>
            )}

            {/* Payment/bill status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment</p>
              {bill?.paymentStatus === "paid" ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-sm">Paid</p>
                    <p className="text-xs capitalize text-emerald-500">{bill.paymentMethod?.replace("_", " ")}</p>
                  </div>
                </div>
              ) : bill ? (
                <div>
                  <p className="text-xs text-slate-500 mb-2">{bill.billNumber} · Unpaid</p>
                  <Button variant="primary" size="sm" className="w-full" onClick={() => setShowPayment(true)}>
                    <CreditCard className="w-3.5 h-3.5" /> Collect Payment
                  </Button>
                </div>
              ) : canBillOrPay ? (
                <div>
                  <p className="text-xs text-slate-400 mb-3">No bill generated yet</p>
                  <Button variant="primary" size="sm" className="w-full" onClick={() => setShowPayment(true)}>
                    <CreditCard className="w-3.5 h-3.5" /> Generate & Pay
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Order voided</p>
              )}
            </div>

            {/* Waiter assignment */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Assigned Waiter</p>
              <div className="relative">
                <button
                  onClick={() => setShowWaiterDrop((v) => !v)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-orange-300 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <UserCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {(order as Order & { user?: { name: string } }).user?.name ?? "Unassigned"}
                    </p>
                    <p className="text-xs text-slate-400">Tap to reassign</p>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", showWaiterDrop && "rotate-180")} />
                </button>

                {showWaiterDrop && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                    {staff.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => assignWaiter(u.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-orange-50 transition-colors text-left border-b border-slate-50 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight">{u.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order meta */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
              {[
                { label: "Order ID", value: `#${order.id}` },
                { label: "Type", value: order.orderType.replace("_", " ") },
                { label: "Table", value: order.table?.name ?? "—" },
                { label: "Items", value: order.items?.length ?? 0 },
                { label: "Created", value: new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">{label}</span>
                  <span className="text-slate-800 font-semibold capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPayment && canBillOrPay && (
        <PaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
          onPaid={load}
          bill={bill?.paymentStatus !== "paid" ? bill : undefined}
          order={!bill ? order : undefined}
        />
      )}

      {printBillData && (
        <PrintBill
          bill={printBillData}
          restaurantName={user?.tenant?.name ?? "Restaurant"}
          gstNumber={user?.tenant?.gstNumber}
          address={user?.tenant?.address}
          phone={user?.tenant?.phone}
        />
      )}
    </AppLayout>
  );
}
