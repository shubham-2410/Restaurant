"use client";
import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { DayEndReconciliation, DayReconciliationPreview } from "@restaurant/shared";
import { BarChart3, CalendarCheck, Lock, RefreshCw } from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReconciliationPage() {
  const { success, error } = useToast();
  const [records,   setRecords]   = useState<DayEndReconciliation[]>([]);
  const [preview,   setPreview]   = useState<DayReconciliationPreview | null>(null);
  const [date,      setDate]      = useState(today());
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [previewing,setPreviewing]= useState(false);
  const [closing,   setClosing]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await api.reconciliation.list()); }
    catch { error("Failed to load reconciliation records"); }
    finally { setLoading(false); }
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const handlePreview = async () => {
    setPreviewing(true);
    try { setPreview(await api.reconciliation.preview(date)); }
    catch { error("Failed to load preview"); }
    finally { setPreviewing(false); }
  };

  const handleClose = async () => {
    if (!confirm(`Close day for ${date}? This will lock the day's records.`)) return;
    setClosing(true);
    try {
      await api.reconciliation.close(date, notes || undefined);
      success(`Day ${date} closed successfully`);
      setPreview(null);
      await load();
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? "Failed to close day");
    } finally { setClosing(false); }
  };

  const alreadyClosed = records.some((r) => r.date === date);

  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="rounded-xl p-4 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--bdr)" }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-xl font-black tabular-nums" style={{ color: "var(--brand)" }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{sub}</p>}
    </div>
  );

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: "var(--page-bg)" }}>
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Day-End Reconciliation</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>Close daily books and review revenue</p>
            </div>
          </div>

          {/* Day selector */}
          <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--bdr)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>Select Day</p>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={date}
                max={today()}
                onChange={(e) => { setDate(e.target.value); setPreview(null); }}
                className="border rounded-xl px-3 py-2 text-sm"
                style={{ borderColor: "var(--bdr)" }}
              />
              <Button variant="outline" onClick={handlePreview} loading={previewing} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Preview
              </Button>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Total Orders"  value={String(preview.totalOrders)} />
                <Stat label="Revenue"       value={formatCurrency(parseFloat(preview.totalRevenue))} />
                <Stat label="GST"           value={formatCurrency(parseFloat(preview.totalGst))} />
                <Stat label="Discount"      value={formatCurrency(parseFloat(preview.totalDiscount))} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Cash"          value={formatCurrency(parseFloat(preview.cashRevenue))} />
                <Stat label="Card"          value={formatCurrency(parseFloat(preview.cardRevenue))} />
                <Stat label="UPI"           value={formatCurrency(parseFloat(preview.upiRevenue))} />
                <Stat label="Razorpay"      value={formatCurrency(parseFloat(preview.razorpayRevenue))} />
              </div>
              {preview.complimentaryCount > 0 && (
                <p className="text-sm font-medium text-purple-700">
                  {preview.complimentaryCount} complimentary order{preview.complimentaryCount > 1 ? "s" : ""}
                </p>
              )}

              {!alreadyClosed && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--bdr)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Close Day</p>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
                    style={{ borderColor: "var(--bdr)" }}
                    rows={2}
                    placeholder="Optional notes…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleClose} loading={closing} className="gap-2">
                    <Lock className="w-4 h-4" /> Close {date}
                  </Button>
                </div>
              )}
              {alreadyClosed && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">Day already closed</span>
                </div>
              )}
            </div>
          )}

          {/* History */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>
              Closed Days History
            </p>
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading…</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-500">No closed days yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--bdr)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--brand-light)" }}>
                      <CalendarCheck className="w-5 h-5" style={{ color: "var(--brand)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{r.date}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {r.totalOrders} orders · GST {formatCurrency(parseFloat(r.totalGst))}
                        {r.complimentaryCount > 0 ? ` · ${r.complimentaryCount} complimentary` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm tabular-nums" style={{ color: "var(--brand)" }}>
                        {formatCurrency(parseFloat(r.totalRevenue))}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
