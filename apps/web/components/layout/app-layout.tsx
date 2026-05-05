"use client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { UtensilsCrossed } from "lucide-react";
import { canAccess, getHome } from "@/lib/rbac";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  // sidebar: "full" | "mini" — desktop only
  const [sidebarMode, setSidebarMode] = useState<"full" | "mini">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sidebar_mode") as "full" | "mini") ?? "full";
    }
    return "full";
  });

  // mobile sidebar open state
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((v) => !v);
    } else {
      const next = sidebarMode === "full" ? "mini" : "full";
      setSidebarMode(next);
      localStorage.setItem("sidebar_mode", next);
    }
  };

  // Close mobile nav on route change
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
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
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

        <div className="app-content">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
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
    <header className="topbar topbar--mobile-only" style={{ display: "none" }}>
      <button className="topbar__menu-btn" onClick={onMenuClick} title="Open menu">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="2" y1="8"  x2="14" y2="8"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="topbar__divider" />
      <span className="topbar__brand">RestaurantOS</span>
      <div className="topbar__spacer" />
      <div className="topbar__clock">
        {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </div>
    </header>
  );
}
