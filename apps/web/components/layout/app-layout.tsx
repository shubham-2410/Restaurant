"use client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Spinner } from "@/components/ui/spinner";
import { canAccess, getHome } from "@/lib/rbac";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && !canAccess(user.role, pathname)) router.replace(getHome(user.role));
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <Spinner size="lg" />
        <p className="loading-screen__text">Loading RestaurantOS…</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (user && !canAccess(user.role, pathname)) return null;

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

      <div className="app-main">
        {!sidebarOpen && (
          <div className="app-topbar">
            <button
              className="app-topbar__toggle"
              onClick={() => setSidebarOpen(true)}
              title="Open menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="2" y1="8"  x2="14" y2="8"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="app-topbar__divider" />
            <span className="app-topbar__brand">RestaurantOS</span>
            <div className="app-topbar__clock"><Clock /></div>
          </div>
        )}
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <>{time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</>
  );
}
