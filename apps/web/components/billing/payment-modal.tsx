"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Bill, Order, PaymentMethod } from "@restaurant/shared";
import { Banknote, CreditCard, Smartphone, Building2, CheckCircle2, Receipt, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const methods: { value: PaymentMethod; label: string; icon: typeof Banknote; color: string }[] = [
  { value: "cash",     label: "Cash",     icon: Banknote,   color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "card",     label: "Card",     icon: CreditCard, color: "border-blue-400 bg-blue-50 text-blue-700" },
  { value: "upi",      label: "UPI",      icon: Smartphone, color: "border-purple-400 bg-purple-50 text-purple-700" },
  { value: "razorpay", label: "Razorpay", icon: Building2,  color: "border-blue-400 bg-blue-50 text-blue-700" },
];

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
  bill?: Bill | null;
  order?: Order | null;
}

type Phase = "form" | "success" | "error";

export function PaymentModal({ open, onClose, onPaid, bill, order }: PaymentModalProps) {
  const { success } = useToast();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const baseTotal    = bill ? parseFloat(bill.total) : order ? parseFloat(order.total) : 0;
  const subtotal     = bill ? parseFloat(bill.subtotal) : order ? parseFloat(order.subtotal) : 0;
  const gst          = bill ? parseFloat(bill.gstAmount) : order ? parseFloat(order.gstAmount) : 0;
  const discountAmt  = Math.min(parseFloat(discount) || 0, baseTotal);
  const finalTotal   = Math.max(0, baseTotal - discountAmt);
  const label        = bill?.billNumber ?? (order ? `Order #${order.id}` : "");

  const handlePay = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      let targetBill = (bill?.paymentStatus !== "paid") ? bill : null;

      // No existing bill yet — generate one first
      if (!targetBill && order) {
        targetBill = await api.billing.createForOrder(order.id);
      }

      if (!targetBill) throw new Error("Unable to create bill. Please try again.");

      await api.billing.recordPayment(targetBill.id, {
        paymentMethod: method,
        discount: discountAmt.toFixed(2),
      });

      setPhase("success");
      setTimeout(() => {
        success(`${formatCurrency(finalTotal)} collected via ${method.toUpperCase()}`);
        onPaid();
        onClose();
        setPhase("form");
      }, 1400);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Payment failed. Please try again.";
      setErrorMsg(msg);
      setPhase("error");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setPhase("form");
    setErrorMsg("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={phase === "success" ? "Payment Complete!" : phase === "error" ? "Payment Failed" : "Collect Payment"}
      size="sm"
      footer={
        phase === "success" ? undefined :
        phase === "error" ? (
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onClick={handleClose} className="flex-1">Close</Button>
            <Button variant="primary" onClick={() => setPhase("form")} className="flex-1">Try Again</Button>
          </div>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handlePay} loading={saving} className="px-8 font-bold">
              Collect {formatCurrency(finalTotal)}
            </Button>
          </>
        )
      }
    >
      {/* ── Success ── */}
      {phase === "success" && (
        <div className="flex flex-col items-center py-8 gap-3 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-11 h-11 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{formatCurrency(finalTotal)}</p>
            <p className="text-sm text-slate-500 mt-1 capitalize font-medium">Received via {method}</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {phase === "error" && (
        <div className="flex flex-col items-center py-8 gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-9 h-9 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900 mb-1">Something went wrong</p>
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 max-w-xs">
              {errorMsg}
            </p>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {phase === "form" && (
        <div className="space-y-5">
          {/* Bill reference */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm font-bold text-slate-700">{label}</span>
          </div>

          {/* Amount breakdown */}
          <div className="rounded-xl p-4 space-y-2.5"
            style={{ background: "var(--brand-light)", border: "1px solid var(--brand-mid)" }}>
            <div className="flex justify-between text-sm" style={{ color: "var(--text-muted)" }}>
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: "var(--text-muted)" }}>
              <span>GST</span>
              <span className="tabular-nums font-semibold">{formatCurrency(gst)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm font-semibold" style={{ color: "var(--success)" }}>
                <span>Discount</span>
                <span className="tabular-nums">− {formatCurrency(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t" style={{ borderColor: "var(--brand-mid)" }}>
              <span className="font-bold" style={{ color: "var(--text-secondary)" }}>Total</span>
              <span className="text-2xl font-black tabular-nums" style={{ color: "var(--brand)" }}>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {methods.map(({ value, label: mLabel, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setMethod(value)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all",
                    method === value ? `${color} shadow-sm` : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{mLabel}</span>
                  {method === value && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <Input
            label="Discount (₹)"
            type="number"
            min="0"
            max={String(baseTotal)}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
          />
        </div>
      )}
    </Modal>
  );
}
