"use client";
import { Users, ShoppingBag, Eye } from "lucide-react";
import type { RestaurantTable, TableStatus } from "@restaurant/shared";

const statusClass: Record<TableStatus, string> = {
  available: "table-card--available",
  occupied:  "table-card--occupied",
  reserved:  "table-card--reserved",
  cleaning:  "table-card--cleaning",
};

const statusLabel: Record<TableStatus, string> = {
  available: "Available",
  occupied:  "Occupied",
  reserved:  "Reserved",
  cleaning:  "Cleaning",
};

interface TableCardProps {
  table: RestaurantTable;
  onStatusChange: (id: number, status: TableStatus) => void;
  onTakeOrder?: (table: RestaurantTable) => void;
  canChangeStatus?: boolean;
}

export function TableCard({ table, onStatusChange, onTakeOrder, canChangeStatus = true }: TableCardProps) {
  return (
    <div className={`table-card ${statusClass[table.status]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="table-card__name">{table.name}</p>
          <span className="table-card__badge">
            <span className="table-card__dot" />
            {statusLabel[table.status]}
          </span>
        </div>
        <span className="table-card__capacity">
          <Users size={13} />
          {table.capacity}
        </span>
      </div>

      {table.status === "occupied" && table.currentOrderId && (
        <button className="table-card__action table-card__action--view" onClick={() => onTakeOrder?.(table)}>
          <Eye size={13} />
          View Order #{table.currentOrderId}
        </button>
      )}

      {table.status === "available" && (
        <button className="table-card__action table-card__action--take" onClick={() => onTakeOrder?.(table)}>
          <ShoppingBag size={13} />
          Take Order
        </button>
      )}

      {canChangeStatus && (
        <select
          className="table-card__select"
          value={table.status}
          onChange={(e) => onStatusChange(table.id, e.target.value as TableStatus)}
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="cleaning">Cleaning</option>
        </select>
      )}
    </div>
  );
}
