"use client";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RestaurantTable, TableStatus } from "@restaurant/shared";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type StatusStyle = { bg: string; border: string; text: string; dot: string; label: string };

const statusConfig: Record<TableStatus, StatusStyle> = {
  available: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400", label: "Available" },
  occupied:  { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500",    label: "Occupied"  },
  reserved:  { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400",  label: "Reserved"  },
  cleaning:  { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-400",   label: "Cleaning"  },
};

interface TableCardProps {
  table: RestaurantTable;
  onStatusChange: (id: number, status: TableStatus) => void;
}

export function TableCard({ table, onStatusChange }: TableCardProps) {
  const router = useRouter();
  const cfg = statusConfig[table.status];

  return (
    <div className={cn("border-2 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow", cfg.border, cfg.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={cn("text-2xl font-black tracking-tight", cfg.text)}>{table.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
            <span className={cn("text-xs font-semibold", cfg.text)}>{cfg.label}</span>
          </div>
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg", cfg.text, "bg-white/60")}>
          <Users className="w-3.5 h-3.5" />
          {table.capacity}
        </div>
      </div>

      {table.status === "occupied" && table.currentOrderId && (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/orders/${table.currentOrderId}`)}
        >
          View Order #{table.currentOrderId}
        </Button>
      )}

      <select
        value={table.status}
        onChange={(e) => onStatusChange(table.id, e.target.value as TableStatus)}
        className={cn(
          "w-full text-xs font-medium border rounded-lg px-2 py-1.5 bg-white/70",
          cfg.border, cfg.text,
          "focus:outline-none focus:ring-2 focus:ring-orange-400",
        )}
      >
        <option value="available">Available</option>
        <option value="occupied">Occupied</option>
        <option value="reserved">Reserved</option>
        <option value="cleaning">Cleaning</option>
      </select>
    </div>
  );
}
