"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Grid2X2,
  ChefHat, Receipt, Users, Settings, LogOut, ClipboardList,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import type { Role } from "@/lib/rbac";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "manager"] },
  { href: "/pos",       label: "New Order",  icon: ShoppingBag,     roles: ["owner", "manager", "cashier", "waiter"] },
  { href: "/orders",    label: "Orders",     icon: ClipboardList,   roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { href: "/kitchen",   label: "Kitchen",    icon: ChefHat,         roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { href: "/tables",    label: "Tables",     icon: Grid2X2,         roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { href: "/billing",   label: "Billing",    icon: Receipt,         roles: ["owner", "manager", "cashier"] },
  { href: "/menu",      label: "Menu",       icon: UtensilsCrossed, roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { href: "/staff",     label: "Staff",      icon: Users,           roles: ["owner", "manager", "cashier"] },
  { href: "/settings",  label: "Settings",   icon: Settings,        roles: ["owner", "manager"] },
];

const roleColor: Record<string, string> = {
  owner:   "bg-purple-500",
  manager: "bg-blue-500",
  cashier: "bg-emerald-500",
  waiter:  "bg-amber-500",
  kitchen: "bg-orange-500",
};

interface SidebarProps {
  mode: "full" | "mini";
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

export function Sidebar({ mode, mobileOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const role = (user?.role ?? "") as Role;
  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const isMini = mode === "mini";

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch {}
    logout();
    router.push("/login");
  };

  const sidebarClass = [
    "sidebar",
    isMini ? "sidebar--mini" : "",
    mobileOpen ? "sidebar--mobile-open" : "",
  ].filter(Boolean).join(" ");

  return (
    <aside className={sidebarClass}>
      <div className="sidebar__inner">

        {/* ── Header / brand ── */}
        <div className="sidebar__header">
          <div className="sidebar__logo-icon">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <span className="sidebar__brand-name">RestaurantOS</span>
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            title={isMini ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isMini
              ? <PanelLeftOpen  className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>
        </div>

        {/* ── Restaurant name ── */}
        {user?.tenant && (
          <div className="sidebar__tenant">
            <p className="sidebar__tenant-label">Restaurant</p>
            <p className="sidebar__tenant-name">{user.tenant.name}</p>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="sidebar__nav">
          {visibleNav.map((item) => {
            const Icon   = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                data-label={item.label}
                className={`sidebar__nav-item${active ? " sidebar__nav-item--active" : ""}`}
              >
                <Icon className="sidebar__nav-icon" />
                <span className="sidebar__nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Footer / user ── */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className={`sidebar__avatar ${roleColor[role] ?? "bg-slate-600"}`}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user?.name}</p>
              <p className="sidebar__user-role">{role}</p>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut className="sidebar__nav-icon" />
            <span className="sidebar__logout-label">Sign out</span>
          </button>
        </div>

      </div>
    </aside>
  );
}
