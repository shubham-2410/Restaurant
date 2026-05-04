"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Grid2X2,
  ChefHat, Receipt, Users, Settings, LogOut, ClipboardList,
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

const roleLabel: Record<string, string> = {
  owner: "Owner", manager: "Manager", cashier: "Cashier", waiter: "Waiter", kitchen: "Kitchen",
};

interface SidebarProps { open: boolean; onToggle: () => void; }

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const role = (user?.role ?? "") as Role;
  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch {}
    logout();
    router.push("/login");
  };

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : "sidebar--closed"}`}>
      <div className="sidebar__inner">

        <div className="sidebar__logo">
          <button className="sidebar__toggle" onClick={onToggle} title="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2" y1="8"  x2="14" y2="8"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="sidebar__brand-icon">
            <UtensilsCrossed className="sidebar__nav-icon" style={{ color: '#fff' }} />
          </div>
          <span className="sidebar__brand-name">RestaurantOS</span>
        </div>

        {user?.tenant && (
          <div className="sidebar__tenant">
            <p className="sidebar__tenant-label">Restaurant</p>
            <p className="sidebar__tenant-name">{user.tenant.name}</p>
          </div>
        )}

        <nav className="sidebar__nav">
          {visibleNav.map((item) => {
            const Icon   = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__nav-item${active ? " sidebar__nav-item--active" : ""}`}
              >
                <Icon className="sidebar__nav-icon" />
                {item.label}
                {active && <span className="sidebar__nav-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className={`sidebar__avatar ${roleColor[role] ?? "bg-slate-600"}`}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="sidebar__user-name">{user?.name}</p>
              <p className="sidebar__user-role">{roleLabel[role] ?? role}</p>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut className="sidebar__nav-icon" />
            Sign out
          </button>
        </div>

      </div>
    </aside>
  );
}
