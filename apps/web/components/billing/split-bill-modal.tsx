"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Bill, PaymentMethod } from "@restaurant/shared";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

interface Split {
  label: string;
  amount: string;
  paymentMethod: PaymentMethod;
}

interface SplitBillModalProps {
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
  bill: Bill;
}

const PM_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash",     label: "Cash" },
  { value: "card",     label: "Card" },
  { value: "upi",      label: "UPI" },
  { value: "razorpay", label: "Razorpay" },
];

export function SplitBillModal({ open, onClose, onPaid, bill }: SplitBillModalProps) {
  const { success, error } = useToast();
  const [splits, setSplits] = useState<Split[]>([
    { label: "Person 1", amount: "", paymentMethod: "cash" },
    { label: "Person 2", amount: "", paymentMethod: "cash" },
  ]);
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const total      = parseFloat(bill.total);
  const splitTotal = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const remaining  = +(total - splitTotal).toFixed(2);
  const balanced   = Math.abs(remaining) < 0.01;

  const addSplit = () => setSplits((s) => [...s, { label: `Person ${s.length + 1}`, amount: "", paymentMethod: "cash" }]);
  const removeSplit = (i: number) => setSplits((s) => s.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Split, value: string) =>
    setSplits((s) => s.map((sp, idx) => idx === i ? { ...sp, [field]: value } : sp));

  const splitEvenly = () => {
    const each = (total / splits.length).toFixed(2);
    setSplits((s) => s.map((sp, i) => ({ ...sp, amount: i === s.length - 1 ? (total - parseFloat(each) * (s.length - 1)).toFixed(2) : each })));
  };

  const handlePay = async () => {
    if (!balanced) { error("Split amounts must equal total"); return; }
    setSaving(true);
    try {
      await api.billing.splitPayment(bill.id, { splits });
      setDone(true);
      setTimeout(() => {
        success("Bill paid via split payment");
        onPaid();
        onClose();
        setDone(false);
      }, 1200);
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? "Split payment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Split Bill"
      size="md"
      footer={
        done ? undefined : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handlePay} loading={saving} disabled={!balanced}>
              Confirm Split Payment
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-center py-8 gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <p className="font-bold text-slate-900">Split payment complete!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Bill Total</p>
              <p className="text-xl font-black tabular-nums" style={{ color: "var(--brand)" }}>
                {formatCurrency(total)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Remaining</p>
              <p className={`text-sm font-bold tabular-nums ${balanced ? "text-emerald-600" : remaining > 0 ? "text-amber-600" : "text-red-600"}`}>
                {balanced ? "Balanced ✓" : formatCurrency(Math.abs(remaining))}
                {!balanced && (remaining > 0 ? " short" : " over")}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={splitEvenly} className="w-full">
            Split Evenly
          </Button>

          <div className="space-y-2">
            {splits.map((sp, i) => (
              <div key={i} className="flex items-center gap-2 p-3 border rounded-xl" style={{ borderColor: "var(--bdr)" }}>
                <div className="flex-1 grid grid-cols-3 gap-2 min-w-0">
                  <input
                    className="text-sm border rounded px-2 py-1.5 col-span-1"
                    style={{ borderColor: "var(--bdr)" }}
                    value={sp.label}
                    onChange={(e) => update(i, "label", e.target.value)}
                    placeholder="Label"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sp.amount}
                    onChange={(e) => update(i, "amount", e.target.value)}
                    placeholder="0.00"
                    className="col-span-1"
                  />
                  <select
                    className="text-sm border rounded px-2 py-1.5 col-span-1"
                    style={{ borderColor: "var(--bdr)" }}
                    value={sp.paymentMethod}
                    onChange={(e) => update(i, "paymentMethod", e.target.value)}
                  >
                    {PM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {splits.length > 2 && (
                  <button onClick={() => removeSplit(i)} className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addSplit} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Person
          </Button>
        </div>
      )}
    </Modal>
  );
}
