"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Grid2X2,
  ChefHat, Receipt, Users, Settings, LogOut, UtensilsCrossed as Logo,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingBag },
  { href: "/kitchen", label: "Kitchen (KDS)", icon: ChefHat },
  { href: "/tables", label: "Tables", icon: Grid2X2 },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch {}
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <Logo className="w-6 h-6 text-orange-400 mr-2" />
        <span className="font-bold text-lg tracking-tight">RestaurantOS</span>
      </div>
      <div className="px-3 py-2 border-b border-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Restaurant</p>
        <p className="text-sm font-medium text-slate-200 truncate">{user?.tenant?.name}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-orange-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
