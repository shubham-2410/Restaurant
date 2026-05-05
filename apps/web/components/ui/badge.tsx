import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant =
  | "default" | "success" | "warning" | "danger" | "info" | "purple"
  | "pending" | "preparing" | "ready" | "cancelled" | "paid" | "unpaid";

const styles: Record<BadgeVariant, string> = {
  default:   "bg-gray-100 text-gray-600 border border-gray-200",
  success:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning:   "bg-amber-50 text-amber-700 border border-amber-200",
  danger:    "bg-red-50 text-red-700 border border-red-200",
  info:      "bg-blue-50 text-blue-700 border border-blue-200",
  purple:    "bg-purple-50 text-purple-700 border border-purple-200",
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  preparing: "bg-blue-50 text-blue-700 border border-blue-200",
  ready:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
  paid:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  unpaid:    "bg-orange-50 text-orange-700 border border-orange-200",
};

const dotColor: Record<BadgeVariant, string> = {
  default:   "bg-gray-400",
  success:   "bg-emerald-500",
  warning:   "bg-amber-500",
  danger:    "bg-red-500",
  info:      "bg-blue-500",
  purple:    "bg-purple-500",
  pending:   "bg-amber-500",
  preparing: "bg-blue-500",
  ready:     "bg-emerald-500",
  cancelled: "bg-gray-400",
  paid:      "bg-emerald-500",
  unpaid:    "bg-orange-500",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = "default", children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold",
      styles[variant],
      className,
    )}>
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          dotColor[variant],
          (variant === "pending" || variant === "preparing") && "animate-pulse",
        )} />
      )}
      {children}
    </span>
  );
}

export function FoodTypeDot({ type }: { type: "veg" | "non_veg" | "egg" }) {
  const cfg = {
    veg:     { color: "border-green-600 bg-green-500", title: "Veg" },
    non_veg: { color: "border-red-700 bg-red-500",     title: "Non-veg" },
    egg:     { color: "border-amber-600 bg-amber-400",  title: "Egg" },
  }[type];
  return (
    <span
      title={cfg.title}
      className={cn("inline-block w-3 h-3 rounded-sm border-2 shrink-0", cfg.color)}
    />
  );
}
