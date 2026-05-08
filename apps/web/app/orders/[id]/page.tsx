"use client";
import { useEffect, useState, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { api, createSseConnection } from "@/lib/api";
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

const statusConfig: Record<string, {
  label: string;
  badgeVariant: "pending" | "preparing" | "ready" | "cancelled" | "paid" | "default";
  icon: typeof Clock;
}> = {
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
  const router  = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const role      = user?.role ?? "";
  const canManage = ["owner", "manager", "cashier"].includes(role);

  const [order,        setOrder]        = useState<Order | null>(null);
  const [staff,        setStaff]        = useState<User[]>([]);
  const [bill,         setBill]         = useState<Bill | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [statusLoading,setStatusLoading]= useState(false);
  const [voidLoading,  setVoidLoading]  = useState(false);
  const [showPayment,  setShowPayment]  = useState(false);
  const [printBillData,setPrintBillData]= useState<Bill | null>(null);
  const [showWaiterDrop,setShowWaiterDrop]= useState(false);
  const loadRef = useRef<() => Promise<void>>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [o, staffList] = await Promise.all([
        api.orders.get(parseInt(id)),
        api.users.list(),
      ]);
      setOrder(o);
      setStaff(staffList.filter((u) => u.isActive));

      if (canManage) {
        try {
          const allBills = await api.billing.list();
          setBill(allBills.find((b) => b.orderId === o.id) ?? null);
        } catch { setBill(null); }
      }
    } catch { error("Failed to load order"); }
    finally { setLoading(false); }
  }, [id, error, canManage]);

  loadRef.current = load;

  useEffect(() => {
    load();

    /* Real-time sync: when kitchen updates KOT status, this page refreshes */
    const closeSSE = createSseConnection((data) => {
      const msg = data as { type: string; orderId?: number };
      if (["order_updated", "kot_status", "order_created"].includes(msg.type)) {
        loadRef.current?.();
      }
    });

    return () => closeSSE();
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

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
  if (!order)  return <AppLayout><div className="p-8 text-sm" style={{ color: "var(--text-faint)" }}>Order not found</div></AppLayout>;

  const cfg      = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;
  const nextStep = statusFlow[order.status];
  const canVoid     = !["cancelled", "billed"].includes(order.status);
  const canBillOrPay = !["cancelled"].includes(order.status);
  const subtotal = parseFloat(order.subtotal);
  const gst      = parseFloat(order.gstAmount);
  const total    = parseFloat(order.total);
  const assignedWaiterName = (order as Order & { user?: { name: string } }).user?.name;

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto" style={{ background: "var(--page-bg)" }}>

        {/* ── Top bar ── */}
        <div className="border-b px-4 py-3 flex items-center gap-3 sticky top-0"
          style={{
            background: "var(--surface)",
            borderColor: "var(--bdr)",
            zIndex: 10,
          }}>
          <button
            onClick={() => router.back()}
            className="p-2 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-black leading-tight" style={{ color: "var(--text-primary)" }}>
                Order #{order.id}
              </h1>
              <Badge variant={cfg.badgeVariant} dot>
                <StatusIcon className="w-3 h-3 mr-0.5" />
                {cfg.label}
              </Badge>
              {order.table && (
                <span className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: "var(--surface-3)", color: "var(--text-muted)", borderRadius: "var(--r-sm)" }}>
                  🪑 {order.table.name}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
              {new Date(order.createdAt).toLocaleString("en-IN", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bill && canManage && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            )}
            {canBillOrPay && canManage && (
              <Button variant="primary" size="sm" onClick={() => setShowPayment(true)} className="gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                {bill?.paymentStatus === "paid" ? "Paid ✓" : bill ? "Collect" : "Checkout"}
              </Button>
            )}
            {canVoid && canManage && (
              <Button variant="danger" size="sm" onClick={voidOrder} loading={voidLoading}>
                <XCircle className="w-3.5 h-3.5" /> Void
              </Button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4 sm:p-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Items card — takes 2 cols on large */}
          <div className="lg:col-span-2 rounded-lg overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--bdr)" }}>
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "var(--bdr)" }}>
              <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {order.items?.length ?? 0} Items
              </h2>
              <span className="text-xs capitalize" style={{ color: "var(--text-faint)" }}>
                {order.orderType.replace("_", " ")}
              </span>
            </div>
            <div>
              {order.items?.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    "px-4 py-3 flex items-start gap-3",
                    i < (order.items?.length ?? 0) - 1 && "border-b",
                  )}
                  style={{ borderColor: "var(--bdr-light)" }}
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "var(--brand-light)", borderRadius: "var(--r-sm)" }}>
                    <span className="text-xs font-bold" style={{ color: "var(--brand)" }}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
                      {item.name}
                    </p>
                    {item.notes && (
                      <p className="text-xs italic mt-0.5" style={{ color: "var(--text-faint)" }}>"{item.notes}"</p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {formatCurrency(parseFloat(item.price))} each
                    </p>
                  </div>
                  <span className="font-bold text-sm tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(parseFloat(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill summary */}
            <div className="px-4 py-4 border-t space-y-2"
              style={{ borderColor: "var(--bdr)", background: "var(--surface-2)" }}>
              <div className="flex justify-between text-sm" style={{ color: "var(--text-muted)" }}>
                <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "var(--text-muted)" }}>
                <span>GST</span><span className="tabular-nums">{formatCurrency(gst)}</span>
              </div>
              {bill && parseFloat(bill.discount) > 0 && (
                <div className="flex justify-between text-sm font-medium"
                  style={{ color: "var(--success)" }}>
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatCurrency(parseFloat(bill.discount))}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t"
                style={{ borderColor: "var(--bdr)" }}>
                <span className="font-black text-base" style={{ color: "var(--text-primary)" }}>Total</span>
                <span className="text-xl font-black tabular-nums" style={{ color: "var(--brand)" }}>
                  {bill ? formatCurrency(parseFloat(bill.total)) : formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">

            {/* Next step action */}
            {nextStep && !["cancelled", "billed"].includes(order.status) && canManage && (
              <div className="rounded-lg p-4 text-white"
                style={{
                  background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)",
                  boxShadow: "var(--shadow-brand)",
                  borderRadius: "var(--r-lg)",
                }}>
                <p className="text-[10px] font-bold mb-0.5 opacity-70 uppercase tracking-wider">Next Step</p>
                <p className="text-sm font-semibold mb-3 opacity-90">Move to next stage</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full font-bold"
                  style={{ background: "#fff", color: "var(--brand)" }}
                  onClick={advanceStatus}
                  loading={statusLoading}
                >
                  {nextStep.label} →
                </Button>
              </div>
            )}

            {/* Read-only status (waiter/kitchen) */}
            {!canManage && !["cancelled", "billed"].includes(order.status) && (
              <div className="rounded-lg p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-faint)" }}>
                  Status
                </p>
                <Badge variant={cfg.badgeVariant} dot>{cfg.label}</Badge>
                <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
                  Status is managed by cashier or manager.
                </p>
              </div>
            )}

            {/* Payment */}
            {canManage && (
              <div className="rounded-lg p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: "var(--text-faint)" }}>
                  Payment
                </p>
                {bill?.paymentStatus === "paid" ? (
                  <div className="flex items-center gap-2" style={{ color: "var(--success)" }}>
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <p className="font-bold text-sm">Paid</p>
                      <p className="text-xs capitalize" style={{ color: "var(--success)" }}>
                        {bill.paymentMethod?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                ) : bill ? (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      {bill.billNumber} · Unpaid
                    </p>
                    <Button variant="primary" size="sm" className="w-full" onClick={() => setShowPayment(true)}>
                      <CreditCard className="w-3.5 h-3.5" /> Collect Payment
                    </Button>
                  </div>
                ) : canBillOrPay ? (
                  <div>
                    <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                      No bill generated yet
                    </p>
                    <Button variant="primary" size="sm" className="w-full" onClick={() => setShowPayment(true)}>
                      <CreditCard className="w-3.5 h-3.5" /> Generate &amp; Pay
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>Order voided</p>
                )}
              </div>
            )}

            {/* Waiter assignment */}
            <div className="rounded-lg p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-faint)" }}>
                Assigned Waiter
              </p>
              {canManage ? (
                <div className="relative">
                  <button
                    onClick={() => setShowWaiterDrop((v) => !v)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded border transition-colors text-left"
                    style={{ border: "1px solid var(--bdr)", borderRadius: "var(--r-md)" }}
                  >
                    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      style={{ background: "var(--brand-light)", borderRadius: "var(--r-sm)" }}>
                      <UserCircle className="w-4 h-4" style={{ color: "var(--brand)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {assignedWaiterName ?? "Unassigned"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>Tap to reassign</p>
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 shrink-0 transition-transform",
                      showWaiterDrop && "rotate-180",
                    )} style={{ color: "var(--text-faint)" }} />
                  </button>
                  {showWaiterDrop && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded border shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto"
                      style={{ background: "var(--surface)", borderColor: "var(--bdr)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-xl)" }}>
                      {staff.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => assignWaiter(u.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b last:border-0 text-left transition-colors hover:bg-blue-50"
                          style={{ borderColor: "var(--bdr-light)" }}
                        >
                          <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "var(--surface-3)", color: "var(--text-muted)", borderRadius: "var(--r-sm)" }}>
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                              {u.name}
                            </p>
                            <p className="text-xs capitalize" style={{ color: "var(--text-faint)" }}>{u.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-2.5 rounded border"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--bdr)", borderRadius: "var(--r-md)" }}>
                  <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{ background: "var(--brand-light)", borderRadius: "var(--r-sm)" }}>
                    <UserCircle className="w-4 h-4" style={{ color: "var(--brand)" }} />
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {assignedWaiterName ?? "Unassigned"}
                  </p>
                </div>
              )}
            </div>

            {/* Order meta */}
            <div className="rounded-lg p-4 text-xs space-y-2.5"
              style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }}>
              {[
                { label: "Order ID", value: `#${order.id}` },
                { label: "Type",     value: order.orderType.replace("_", " ") },
                { label: "Table",    value: order.table?.name ?? "—" },
                { label: "Items",    value: order.items?.length ?? 0 },
                { label: "Created",  value: new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>{label}</span>
                  <span className="font-semibold capitalize" style={{ color: "var(--text-secondary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPayment && canBillOrPay && canManage && (
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
