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

      <div className="table-card__top">
        <div>
          <p className="table-card__name">{table.name}</p>
          <span className="table-card__status">
            <span className="table-card__dot" />
            {statusLabel[table.status]}
          </span>
        </div>
        <span className="table-card__capacity">
          <Users size={11} />
          {table.capacity}
        </span>
      </div>

      {/* Primary CTA with tooltip hinting at action */}
      {table.status === "occupied" && table.currentOrderId && (
        <button
          className="table-card__action table-card__action--view"
          onClick={() => onTakeOrder?.(table)}
          title={`View Order #${table.currentOrderId}`}
        >
          <Eye size={13} />
          View Order #{table.currentOrderId}
        </button>
      )}

      {table.status === "available" && (
        <button
          className="table-card__action table-card__action--take"
          onClick={() => onTakeOrder?.(table)}
          title="Start a new order for this table"
        >
          <ShoppingBag size={13} />
          Take Order
        </button>
      )}

      {/* Status changer — only for privileged roles */}
      {canChangeStatus && (
        <select
          className="table-card__select"
          value={table.status}
          onChange={(e) => onStatusChange(table.id, e.target.value as TableStatus)}
          title="Change table status"
        >
          <option value="available">Set: Available</option>
          <option value="occupied">Set: Occupied</option>
          <option value="reserved">Set: Reserved</option>
          <option value="cleaning">Set: Cleaning</option>
        </select>
      )}

    </div>
  );
}
