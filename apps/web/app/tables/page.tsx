"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import type { RestaurantTable } from "@restaurant/shared";
import { Plus, Grid2X2 } from "lucide-react";
import { TableCard } from "@/components/tables/table-card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";

export default function TablesPage() {
  const { success, error } = useToast();
  const { user } = useAuth();
  const router   = useRouter();
  const [tables, setTables]   = useState<RestaurantTable[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState({ name: "", capacity: "4" });
  const [saving, setSaving]   = useState(false);
  const [filter, setFilter]   = useState<"all"|"available"|"occupied"|"reserved">("all");

  const role        = user?.role ?? "";
  const canAddTable = ["owner","manager"].includes(role);

  const load = useCallback(async () => {
    try { setTables(await api.tables.list()); } catch {}
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);

  const changeStatus = async (id: number, status: RestaurantTable["status"]) => {
    try {
      await api.tables.update(id, { status });
      setTables((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    } catch { error("Failed to update table status"); }
  };

  const handleTableClick = (table: RestaurantTable) => {
    if (table.status === "occupied" && table.currentOrderId) router.push(`/orders/${table.currentOrderId}`);
    else if (table.status === "available") router.push(`/pos?tableId=${table.id}`);
  };

  const addTable = async () => {
    if (!form.name.trim()) { error("Table name is required"); return; }
    setSaving(true);
    try {
      await api.tables.create({ name: form.name, capacity: parseInt(form.capacity) });
      success(`Table "${form.name}" added`);
      load();
      setAddOpen(false);
      setForm({ name: "", capacity: "4" });
    } catch { error("Failed to add table"); }
    finally { setSaving(false); }
  };

  const counts = {
    all:       tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied:  tables.filter((t) => t.status === "occupied").length,
    reserved:  tables.filter((t) => t.status === "reserved").length,
  };
  const filtered = filter === "all" ? tables : tables.filter((t) => t.status === filter);

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col">
        <div className="page-header">
          <div>
            <h1 className="page-title flex items-center">
              <span className="section-bar" />Tables
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 pl-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />{counts.available} available</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />{counts.occupied} occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />{counts.reserved} reserved</span>
            </div>
          </div>
          {canAddTable && (
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" /> Add Table
            </Button>
          )}
        </div>

        <div className="filter-tabs mb-5">
          {(["all","available","occupied","reserved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-tab${filter === f ? " filter-tab--active" : ""}`}
            >
              {f}
              <span className="filter-tab__count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {tables.length === 0 ? (
          <EmptyState
            icon={Grid2X2}
            title="No tables yet"
            description={canAddTable ? "Add tables to start managing your floor layout." : "No tables have been added yet."}
            action={canAddTable ? <Button variant="primary" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" />Add Table</Button> : undefined}
          />
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No {filter} tables</div>
        ) : (
          <div className="tables-grid content-start">
            {filtered.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onStatusChange={changeStatus}
                onTakeOrder={handleTableClick}
                canChangeStatus={["owner","manager","cashier"].includes(role)}
              />
            ))}
          </div>
        )}
      </div>

      {canAddTable && (
        <Modal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title="Add New Table"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={addTable} loading={saving}>Add Table</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Table Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. T1, Table 1, Terrace-A" autoFocus />
            <Input label="Seating Capacity" type="number" min="1" max="50" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
