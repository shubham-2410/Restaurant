"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Order, RestaurantTable } from "@restaurant/shared";
import { cn } from "@/lib/utils";

interface TransferTableModalProps {
  open: boolean;
  onClose: () => void;
  onTransferred: () => void;
  order: Order;
  tables: RestaurantTable[];
}

export function TransferTableModal({ open, onClose, onTransferred, order, tables }: TransferTableModalProps) {
  const { success, error } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving,     setSaving]     = useState(false);

  const available = tables.filter((t) => t.status === "available" && t.id !== order.tableId);

  const handleTransfer = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.orders.transferTable(order.id, selectedId);
      success("Table transferred successfully");
      onTransferred();
      onClose();
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? "Transfer failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Table"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleTransfer} loading={saving} disabled={!selectedId}>
            Transfer
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Move Order #{order.id} from <strong>{order.table?.name ?? "current table"}</strong> to:
        </p>

        {available.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-faint)" }}>
            No available tables to transfer to.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {available.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all",
                  selectedId === t.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs mt-0.5 opacity-70">{t.capacity} seats</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
