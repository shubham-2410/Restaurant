import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
          "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
          "transition-all duration-150 shadow-sm",
          error
            ? "border-red-400 bg-red-50 focus:ring-red-400"
            : "border-gray-200 bg-white hover:border-gray-300",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, className, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white",
          "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
          "disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm",
          "hover:border-gray-300 appearance-auto",
          error ? "border-red-400" : "border-gray-200",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
);
Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          "w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
          "transition-all duration-150 shadow-sm hover:border-gray-300",
          error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
