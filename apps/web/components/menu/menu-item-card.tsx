"use client";
import { Pencil, Trash2, ImageOff, ToggleLeft, ToggleRight } from "lucide-react";
import { FoodTypeDot, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem } from "@restaurant/shared";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (id: number) => void;
  onToggleAvailability?: (item: MenuItem) => void;
  showActions?: boolean;
}

export function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability, showActions = true }: MenuItemCardProps) {
  return (
    <div className={cn(
      "bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col",
      item.isAvailable ? "border-slate-200" : "border-slate-100 opacity-70",
    )}>
      {/* Image */}
      {item.imageUrl ? (
        <div className="h-40 overflow-hidden bg-slate-100 shrink-0">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-150 flex items-center justify-center shrink-0">
          <ImageOff className="w-10 h-10 text-slate-300" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-2 mb-2">
          <FoodTypeDot type={item.foodType} className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{item.name}</h3>
            {item.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3 pl-5">
          <Badge variant="default">GST {item.gstRate}%</Badge>
          {!item.isAvailable && <Badge variant="cancelled">Unavailable</Badge>}
        </div>

        <div className="flex items-center justify-between mt-auto pl-5">
          <span className="text-base font-bold text-slate-900">{formatCurrency(parseFloat(item.price))}</span>
          {showActions && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onToggleAvailability?.(item)}
                title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  item.isAvailable
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-slate-400 hover:bg-slate-100",
                )}
              >
                {item.isAvailable
                  ? <ToggleRight className="w-5 h-5" />
                  : <ToggleLeft className="w-5 h-5" />
                }
              </button>
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(item)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete?.(item.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
