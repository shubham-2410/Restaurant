"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Grid2X2,
  ChefHat, Receipt, Users, Settings, LogOut, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos",       label: "New Order",  icon: ShoppingBag },
  { href: "/orders",    label: "Orders",     icon: ClipboardList },
  { href: "/kitchen",   label: "Kitchen",    icon: ChefHat },
  { href: "/tables",    label: "Tables",     icon: Grid2X2 },
  { href: "/billing",   label: "Billing",    icon: Receipt },
  { href: "/menu",      label: "Menu",       icon: UtensilsCrossed },
  { href: "/staff",     label: "Staff",      icon: Users },
  { href: "/settings",  label: "Settings",   icon: Settings },
];

const roleColor: Record<string, string> = {
  owner:   "bg-purple-500",
  manager: "bg-blue-500",
  cashier: "bg-emerald-500",
  waiter:  "bg-amber-500",
  kitchen: "bg-orange-500",
};

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  // NOTE: sidebar does NOT auto-close on navigation — stays as the user left it

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch {}
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "h-screen bg-slate-950 text-white flex flex-col shrink-0 border-r border-slate-800",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        open ? "w-60" : "w-0",
      )}
    >
      {/* Inner wrapper — fixed width so content never reflows during animation */}
      <div className="w-60 h-full flex flex-col">

        {/* Logo + toggle */}
        <div className="h-12 flex items-center gap-3 px-3 border-b border-slate-800 shrink-0">
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white shrink-0"
            title="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight whitespace-nowrap">RestaurantOS</span>
        </div>

        {/* Restaurant name */}
        {user?.tenant && (
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold leading-none mb-0.5">Restaurant</p>
            <p className="text-sm font-semibold text-slate-200 truncate whitespace-nowrap">{user.tenant.name}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon   = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-100 whitespace-nowrap",
                  active
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-2 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0",
              roleColor[user?.role ?? ""] ?? "bg-slate-600",
            )}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate whitespace-nowrap leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
