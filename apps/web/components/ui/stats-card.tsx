import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, iconColor = "text-orange-500", iconBg = "bg-orange-50", trend, className }: StatsCardProps) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            trend.value >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
          )}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none mb-1.5">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
}
