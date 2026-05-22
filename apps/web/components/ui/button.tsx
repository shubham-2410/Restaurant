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
  primary:   "bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:opacity-90 active:opacity-80 shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
  secondary: "bg-[#1A1410] text-[#F5EDE4] hover:bg-[#2A1F18] active:bg-[#0F0D0A] shadow-sm disabled:opacity-50",
  ghost:     "bg-transparent text-[#7A6555] hover:bg-[#F6F3EE] hover:text-[#3D2E22] disabled:opacity-40",
  danger:    "bg-gradient-to-br from-red-600 to-red-700 text-white hover:opacity-90 active:opacity-80 shadow-sm disabled:opacity-50",
  success:   "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white hover:opacity-90 active:opacity-80 shadow-sm disabled:opacity-50",
  outline:   "bg-white text-[#3D2E22] border border-[#E8E1D8] hover:bg-[#FDF4EC] hover:border-[#F9D4AF] shadow-sm disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm:   "px-3 py-1.5 text-xs rounded-full gap-1.5 h-8",
  md:   "px-4 py-2 text-sm rounded-lg gap-2 h-9",
  lg:   "px-5 py-2.5 text-sm rounded-lg gap-2 h-11",
  icon: "p-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1",
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
