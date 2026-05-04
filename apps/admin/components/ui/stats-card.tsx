import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label:      string;
  value:      string | number;
  icon:       LucideIcon;
  iconColor?: string;
  iconBg?:    string;
  sub?:       string;
  className?: string;
}

export function StatsCard({
  label, value, icon: Icon,
  iconColor = "text-indigo-600",
  iconBg    = "bg-indigo-50",
  sub,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none mb-1.5">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
