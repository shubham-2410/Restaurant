import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label:      string;
  value:      string | number;
  icon:       LucideIcon;
  iconColor?: string;
  iconBg?:    string;
  accent?:    "orange" | "emerald" | "blue" | "purple" | "red";
  trend?: { value: number; label: string };
  className?: string;
}

const accentMap: Record<string, string> = {
  orange:  "stat-card--orange",
  emerald: "stat-card--emerald",
  blue:    "stat-card--blue",
  purple:  "stat-card--purple",
  red:     "stat-card--red",
};

export function StatsCard({ label, value, icon: Icon, iconColor = "text-orange-500", iconBg = "bg-orange-50", accent = "orange", trend, className = "" }: StatsCardProps) {
  const accentClass = accentMap[accent] ?? "stat-card--orange";
  return (
    <div className={`stat-card ${accentClass} ${className}`}>
      {trend && (
        <span className={`stat-card__trend ${trend.value >= 0 ? "stat-card__trend--up" : "stat-card__trend--down"}`}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
        </span>
      )}
      <div className={`stat-card__icon-wrap ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__label">{label}</p>
    </div>
  );
}
