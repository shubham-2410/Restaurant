"use client";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
type Size    = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:   "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
  secondary: "bg-gray-900 text-white hover:bg-gray-700 active:bg-gray-950 shadow-sm disabled:opacity-50",
  ghost:     "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40",
  danger:    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm disabled:opacity-50",
  success:   "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm disabled:opacity-50",
  outline:   "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm:   "px-3 py-1.5 text-xs rounded gap-1.5 h-8",
  md:   "px-4 py-2 text-sm rounded gap-2 h-9",
  lg:   "px-5 py-2.5 text-sm rounded gap-2 h-11",
  icon: "p-2 rounded",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        "select-none whitespace-nowrap",
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
