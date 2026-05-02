"use client";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:   "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm shadow-orange-200 disabled:bg-orange-300 disabled:shadow-none",
  secondary: "bg-slate-900 text-white hover:bg-slate-700 active:bg-slate-950 shadow-sm disabled:bg-slate-400",
  ghost:     "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400",
  danger:    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm shadow-red-200 disabled:bg-red-300",
  outline:   "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm:   "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md:   "px-4 py-2 text-sm rounded-lg gap-2",
  lg:   "px-5 py-3 text-sm rounded-xl gap-2",
  icon: "p-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed select-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
