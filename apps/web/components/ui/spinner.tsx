import { cn } from "@/lib/utils";

interface SpinnerProps { size?: "sm" | "md" | "lg"; className?: string; }

const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <svg className={cn("animate-spin text-orange-500", sizes[size], className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3">
      <Spinner size="lg" />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
      </div>
      <div className="h-7 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-3/4" />
    </div>
  );
}
