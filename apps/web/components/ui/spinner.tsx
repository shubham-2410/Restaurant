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
    <div className="flex flex-col h-full items-center justify-center gap-3 py-20">
      <Spinner size="lg" />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

// Keep SkeletonCard for backwards compat - now uses CSS skeleton
export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="skeleton w-10 h-10 rounded-xl" />
      </div>
      <div className="skeleton h-7 rounded w-1/2 mb-2" />
      <div className="skeleton h-3 rounded w-3/4" />
    </div>
  );
}
