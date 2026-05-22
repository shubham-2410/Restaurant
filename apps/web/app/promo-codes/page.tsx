"use client";
import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import type { PromoCode } from "@restaurant/shared";
import { Plus, Pencil, Trash2, Tag, CheckCircle2, XCircle } from "lucide-react";

interface FormState {
  code: string;
  description: string;
  discountType: "flat" | "percent";
  discountValue: string;
  minOrderValue: string;
  maxUses: string;
  expiresAt: string;
  isActive: boolean;
}

const INITIAL: FormState = {
  code: "", description: "", discountType: "flat",
  discountValue: "", minOrderValue: "", maxUses: "", expiresAt: "", isActive: true,
};

export default function PromoCodesPage() {
  const { success, error } = useToast();
  const [promos,  setPromos]  = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form,    setForm]    = useState<FormState>(INITIAL);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPromos(await api.promoCodes.list()); }
    catch { error("Failed to load promo codes"); }
    finally { setLoading(false); }
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(INITIAL); setOpen(true); };
  const openEdit   = (p: PromoCode) => {
    setEditing(p);
    setForm({
      code: p.code, description: p.description ?? "", discountType: p.discountType,
      discountValue: p.discountValue, minOrderValue: p.minOrderValue ?? "",
      maxUses: p.maxUses?.toString() ?? "", expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : "",
      isActive: p.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue) { error("Code and discount value are required"); return; }
    setSaving(true);
    try {
      const payload = {
        code:          form.code,
        description:   form.description || undefined,
        discountType:  form.discountType,
        discountValue: form.discountValue,
        minOrderValue: form.minOrderValue || undefined,
        maxUses:       form.maxUses ? parseInt(form.maxUses) : undefined,
        expiresAt:     form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive:      form.isActive,
      };
      if (editing) {
        await api.promoCodes.update(editing.id, payload);
        success("Promo code updated");
      } else {
        await api.promoCodes.create(payload);
        success("Promo code created");
      }
      setOpen(false);
      await load();
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this promo code?")) return;
    try { await api.promoCodes.delete(id); success("Deleted"); await load(); }
    catch { error("Failed to delete"); }
  };

  const toggle = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: "var(--page-bg)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Promo Codes</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>Discount codes for customers</p>
            </div>
            <Button variant="primary" onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> New Code
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading…</div>
          ) : promos.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No promo codes yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first discount code</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promos.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--bdr)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--brand-light)" }}>
                    <Tag className="w-5 h-5" style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm tracking-widest uppercase" style={{ color: "var(--text-primary)" }}>
                        {p.code}
                      </span>
                      {p.isActive
                        ? <Badge variant="ready" className="text-xs">Active</Badge>
                        : <Badge variant="cancelled" className="text-xs">Inactive</Badge>
                      }
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {p.discountType === "percent" ? `${p.discountValue}% off` : `₹${p.discountValue} off`}
                      {p.minOrderValue && parseFloat(p.minOrderValue) > 0 ? ` · Min ₹${p.minOrderValue}` : ""}
                      {p.maxUses ? ` · ${p.usedCount}/${p.maxUses} used` : ` · ${p.usedCount} uses`}
                    </p>
                    {p.expiresAt && (
                      <p className="text-xs mt-0.5 text-amber-600">
                        Expires {new Date(p.expiresAt).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Promo Code" : "New Promo Code"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editing ? "Save Changes" : "Create Code"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Code" required value={form.code} onChange={toggle("code")} placeholder="SUMMER20" />
          <Input label="Description" value={form.description} onChange={toggle("description")} placeholder="Optional note" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.discountType} onChange={toggle("discountType")}>
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent (%)</option>
            </Select>
            <Input label="Value" required value={form.discountValue} onChange={toggle("discountValue")} placeholder="20" type="number" min="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Order (₹)" value={form.minOrderValue} onChange={toggle("minOrderValue")} placeholder="0" type="number" min="0" />
            <Input label="Max Uses" value={form.maxUses} onChange={toggle("maxUses")} placeholder="Unlimited" type="number" min="1" />
          </div>
          <Input label="Expires At" value={form.expiresAt} onChange={toggle("expiresAt")} type="date" />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="promoActive" checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-blue-600" />
            <label htmlFor="promoActive" className="text-sm font-medium text-slate-700">Active</label>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
