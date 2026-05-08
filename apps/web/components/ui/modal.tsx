"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  children: ReactNode;
  size?:    "sm" | "md" | "lg" | "xl";
  footer?:  ReactNode;
}

const sizeClass = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
};

export function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<() => void>(onClose);
  closeRef.current = onClose;

  /* Mount check — portals need the DOM */
  useEffect(() => { setMounted(true); }, []);

  /* Keyboard + scroll-lock */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    /* Prevent body scroll while modal is open */
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handler);
    };
  }, [open]);

  if (!mounted || !open) return null;

  const panel = (
    /*
     * z-[9999]: beats mobile-nav(100), cart-sheet(160), sidebar(200).
     * Rendered via portal directly into document.body so it escapes ALL
     * parent stacking contexts (overflow:hidden, transform, will-change, etc.)
     */
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,.55)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          animation: "fadeIn 160ms ease both",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className={cn(
          "relative w-full flex flex-col",
          /* Mobile: sheet from bottom */
          "rounded-t-2xl max-h-[92dvh]",
          /* Desktop: centered card */
          "sm:rounded-xl sm:my-4 sm:mx-4",
          sizeClass[size],
        )}
        style={{
          background: "var(--surface)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.06)",
          animation: "modalIn 220ms cubic-bezier(0.34,1.26,0.64,1) both",
        }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 pb-0 sm:hidden" aria-hidden="true">
          <div className="w-8 h-1 rounded-full" style={{ background: "var(--bdr-strong)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--bdr)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-faint)" }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 min-h-0"
          style={{ WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>

        {/* Footer — sticky at bottom */}
        {footer && (
          <div
            className="px-5 py-4 border-t flex-shrink-0"
            style={{
              borderColor: "var(--bdr)",
              background: "var(--surface-2)",
              borderRadius: "0 0 calc(var(--r-xl) - 1px) calc(var(--r-xl) - 1px)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
