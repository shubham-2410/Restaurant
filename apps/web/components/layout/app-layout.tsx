"use client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { UtensilsCrossed, Menu } from "lucide-react";
import { canAccess, getHome } from "@/lib/rbac";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [sidebarMode, setSidebarMode] = useState<"full" | "mini">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sidebar_mode") as "full" | "mini") ?? "full";
    }
    return "full";
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setMobileOpen((v) => !v);
    } else {
      const next = sidebarMode === "full" ? "mini" : "full";
      setSidebarMode(next);
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar_mode", next);
      }
    }
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && !canAccess(user.role, pathname)) router.replace(getHome(user.role));
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__logo">
          <div className="loading-screen__icon">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="loading-screen__name">RestaurantOS</span>
        </div>
        <div className="loading-screen__spinner" />
        <p className="loading-screen__text">Getting things ready…</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (user && !canAccess(user.role, pathname)) return null;

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        mode={sidebarMode}
        mobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="app-main">
        {/* Mobile-only top bar */}
        <MobileTopBar onMenuClick={() => setMobileOpen(true)} />

        {/* Desktop mini-mode expand button */}
        {sidebarMode === "mini" && (
          <button
            className="sidebar__expand-btn"
            onClick={toggleSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            style={{
              display: "flex",
              position: "fixed",
              left: "68px",
              top: "14px",
              zIndex: 39,
              width: "26px",
              height: "26px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--bdr)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              cursor: "pointer",
              boxShadow: "var(--shadow-md)",
              transition: "all var(--fast) var(--ease)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M2 6.5h9M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div className="app-content">
          {children}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}

function MobileTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header
      className="topbar topbar--mobile-only"
      style={{ display: "none" }}
      role="banner"
    >
      <button
        className="topbar__menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="w-4 h-4" aria-hidden="true" />
      </button>
      <div className="topbar__divider" aria-hidden="true" />
      <span className="topbar__brand">RestaurantOS</span>
      <div className="topbar__spacer" />
      <div className="topbar__clock" aria-live="polite">
        {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </div>
    </header>
  );
}
