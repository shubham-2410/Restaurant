"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard, ShoppingBag, ClipboardList, ChefHat,
  Grid2X2, Receipt, UtensilsCrossed,
} from "lucide-react";
import type { Role } from "@/lib/rbac";

const mobileItems = [
  { href: "/dashboard", label: "Dash",    icon: LayoutDashboard, roles: ["owner", "manager"] as Role[] },
  { href: "/pos",       label: "Order",   icon: ShoppingBag,     roles: ["owner", "manager", "cashier", "waiter"] as Role[] },
  { href: "/orders",    label: "Orders",  icon: ClipboardList,   roles: ["owner", "manager", "cashier", "waiter", "kitchen"] as Role[] },
  { href: "/kitchen",   label: "Kitchen", icon: ChefHat,         roles: ["owner", "manager", "cashier", "waiter", "kitchen"] as Role[] },
  { href: "/tables",    label: "Tables",  icon: Grid2X2,         roles: ["owner", "manager", "cashier", "waiter", "kitchen"] as Role[] },
  { href: "/billing",   label: "Billing", icon: Receipt,         roles: ["owner", "manager", "cashier"] as Role[] },
  { href: "/menu",      label: "Menu",    icon: UtensilsCrossed, roles: ["owner", "manager", "cashier", "waiter", "kitchen"] as Role[] },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = (user?.role ?? "") as Role;

  const visibleItems = mobileItems
    .filter((item) => item.roles.includes(role))
    .slice(0, 5);

  if (!user) return null;

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mobile-nav__items">
        {visibleItems.map((item) => {
          const Icon   = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav__item${active ? " mobile-nav__item--active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              <span className="mobile-nav__icon">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="mobile-nav__label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
