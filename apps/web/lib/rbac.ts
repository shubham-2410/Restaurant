// Client-side RBAC — mirrors the server-side permission groups.
// Used to filter navigation and guard pages from direct URL access.

export type Role = "owner" | "manager" | "cashier" | "waiter" | "kitchen";

// Which routes each role is allowed to visit.
// Key = pathname prefix, value = roles that may access it.
const routePermissions: { path: string; roles: Role[] }[] = [
  { path: "/dashboard", roles: ["owner", "manager"] },
  { path: "/pos",       roles: ["owner", "manager", "cashier", "waiter"] },
  { path: "/orders",    roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { path: "/kitchen",   roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { path: "/tables",    roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { path: "/billing",   roles: ["owner", "manager", "cashier"] },
  { path: "/menu",      roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
  { path: "/staff",     roles: ["owner", "manager", "cashier"] },
  { path: "/settings",  roles: ["owner", "manager"] },
];

// The first page a role sees after login.
export const roleHome: Record<Role, string> = {
  owner:   "/dashboard",
  manager: "/dashboard",
  cashier: "/pos",
  waiter:  "/pos",
  kitchen: "/kitchen",
};

export function getHome(role?: string): string {
  return roleHome[(role as Role) ?? ""] ?? "/pos";
}

// Returns true if the given role may visit the given pathname.
export function canAccess(role: string, pathname: string): boolean {
  const rule = routePermissions.find((r) => pathname === r.path || pathname.startsWith(r.path + "/"));
  if (!rule) return true; // unknown/public routes are open
  return rule.roles.includes(role as Role);
}
