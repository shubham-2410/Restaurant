import type { LucideIcon } from "lucide-react";

type Accent = "orange" | "blue" | "green" | "purple" | "red";

interface StatsCardProps {
  label:     string;
  value:     string | number;
  icon:      LucideIcon;
  accent?:   Accent;
  trend?:    { value: number; label: string };
  className?: string;
}

const accentMap: Record<Accent, string> = {
  orange: "stat-card--orange",
  blue:   "stat-card--blue",
  green:  "stat-card--green",
  purple: "stat-card--purple",
  red:    "stat-card--red",
};

export function StatsCard({ label, value, icon: Icon, accent = "orange", trend, className = "" }: StatsCardProps) {
  return (
    <div className={`stat-card ${accentMap[accent]} ${className} anim-fade-up`}>
      <div className="stat-card__accent" />
      {trend && (
        <span className={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full ${
          trend.value >= 0
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-600"
        }`}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
        </span>
      )}
      <div className="stat-card__icon">
        <Icon className="w-5 h-5" />
      </div>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__label">{label}</p>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card-skeleton">
      <div className="skeleton h-3 w-3/4 rounded mb-3" style={{ height: "3px" }} />
      <div className="skeleton w-10 h-10 rounded-xl mb-4" />
      <div className="skeleton h-8 w-1/2 rounded mb-2" />
      <div className="skeleton h-3 w-3/4 rounded" />
    </div>
  );
}
