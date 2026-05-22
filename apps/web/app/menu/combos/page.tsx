"use client";
import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ComboMeal, MenuItem } from "@restaurant/shared";
import { Plus, Pencil, Trash2, Layers, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ComboItemDraft { menuItemId: number; name: string; quantity: number }
interface FormState {
  name: string; description: string; price: string; imageUrl: string; isAvailable: boolean;
  items: ComboItemDraft[];
}
const INITIAL: FormState = { name: "", description: "", price: "", imageUrl: "", isAvailable: true, items: [] };

export default function CombosPage() {
  const { success, error } = useToast();
  const [combos,     setCombos]     = useState<ComboMeal[]>([]);
  const [menuItems,  setMenuItems]  = useState<MenuItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [open,       setOpen]       = useState(false);
  const [editing,    setEditing]    = useState<ComboMeal | null>(null);
  const [form,       setForm]       = useState<FormState>(INITIAL);
  const [saving,     setSaving]     = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([api.menu.combos.list(), api.menu.items.list()]);
      setCombos(c); setMenuItems(m);
    } catch { error("Failed to load combos"); }
    finally { setLoading(false); }
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(INITIAL); setOpen(true); };
  const openEdit   = (c: ComboMeal) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "", price: c.price, imageUrl: c.imageUrl ?? "", isAvailable: c.isAvailable, items: c.items });
    setOpen(true);
  };

  const addItem = (mi: MenuItem) => {
    setForm((f) => {
      const existing = f.items.find((i) => i.menuItemId === mi.id);
      if (existing) return { ...f, items: f.items.map((i) => i.menuItemId === mi.id ? { ...i, quantity: i.quantity + 1 } : i) };
      return { ...f, items: [...f.items, { menuItemId: mi.id, name: mi.name, quantity: 1 }] };
    });
  };
  const removeItem = (menuItemId: number) => setForm((f) => ({ ...f, items: f.items.filter((i) => i.menuItemId !== menuItemId) }));
  const updateQty  = (menuItemId: number, qty: number) =>
    setForm((f) => ({ ...f, items: f.items.map((i) => i.menuItemId === menuItemId ? { ...i, quantity: Math.max(1, qty) } : i) }));

  const handleSave = async () => {
    if (!form.name || !form.price || form.items.length < 1) { error("Name, price and at least 1 item required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, imageUrl: form.imageUrl || undefined, description: form.description || undefined };
      if (editing) { await api.menu.combos.update(editing.id, payload); success("Combo updated"); }
      else         { await api.menu.combos.create(payload);             success("Combo created"); }
      setOpen(false); await load();
    } catch (e: unknown) { error((e as { message?: string })?.message ?? "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this combo?")) return;
    try { await api.menu.combos.delete(id); success("Deleted"); await load(); }
    catch { error("Failed to delete"); }
  };

  const filtered = menuItems.filter((m) =>
    !itemSearch || m.name.toLowerCase().includes(itemSearch.toLowerCase()),
  );

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: "var(--page-bg)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Combo Meals</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>Curated multi-item deals</p>
            </div>
            <Button variant="primary" onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> New Combo
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading…</div>
          ) : combos.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No combos yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first combo meal</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {combos.map((c) => (
                <div key={c.id} className="rounded-xl overflow-hidden"
                  style={{ background: "var(--surface)", border: "1px solid var(--bdr)" }}>
                  {c.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                        {c.description && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{c.description}</p>
                        )}
                      </div>
                      <span className="font-black text-sm tabular-nums shrink-0" style={{ color: "var(--brand)" }}>
                        {formatCurrency(parseFloat(c.price))}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.items.map((item) => (
                        <span key={item.menuItemId} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(c)}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Combo" : "New Combo"} size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Family Feast" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} type="number" min="0" />
            <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://…" />
          </div>

          {/* Selected items */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Items in Combo</p>
            {form.items.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No items yet — search and add below</p>
            ) : (
              <div className="space-y-1.5">
                {form.items.map((i) => (
                  <div key={i.menuItemId} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--bdr)" }}>
                    <span className="flex-1 text-sm">{i.name}</span>
                    <input type="number" min="1" value={i.quantity}
                      onChange={(e) => updateQty(i.menuItemId, parseInt(e.target.value) || 1)}
                      className="w-14 text-center border rounded px-1 py-0.5 text-sm"
                      style={{ borderColor: "var(--bdr)" }} />
                    <button onClick={() => removeItem(i.menuItemId)} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item search */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Add Menu Items</p>
            <Input placeholder="Search items…" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {filtered.map((mi) => (
                <button key={mi.id} onClick={() => addItem(mi)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors hover:bg-blue-50"
                  style={{ border: "1px solid var(--bdr-light)" }}>
                  <span className="text-sm">{mi.name}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                    {formatCurrency(parseFloat(mi.price))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="comboAvail" checked={form.isAvailable}
              onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
              className="w-4 h-4 accent-blue-600" />
            <label htmlFor="comboAvail" className="text-sm font-medium text-slate-700">Available for ordering</label>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
