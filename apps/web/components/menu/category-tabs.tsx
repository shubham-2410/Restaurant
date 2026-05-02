"use client";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@restaurant/shared";

interface CategoryTabsProps {
  categories: MenuCategory[];
  active: number | null;
  onChange: (id: number | null) => void;
  counts?: Record<number, number>;
}

export function CategoryTabs({ categories, active, onChange, counts }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
          active === null
            ? "bg-slate-900 text-white shadow-sm"
            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
        )}
      >
        All
      </button>
      {categories.filter((c) => c.isActive).map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-1.5",
            active === c.id
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
          )}
        >
          {c.name}
          {counts && counts[c.id] !== undefined && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              active === c.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
            )}>
              {counts[c.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
