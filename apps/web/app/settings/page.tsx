"use client";
import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";
import {
  Building2, Hash, ChefHat,
  Shield, Info, Printer, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }}>
      <div className="px-5 py-4 border-b flex items-center gap-3"
        style={{ borderColor: "var(--bdr)" }}>
        <div className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: "var(--brand-light)", borderRadius: "var(--r-sm)" }}>
          <Icon className="w-4 h-4" style={{ color: "var(--brand)" }} />
        </div>
        <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3 border-b last:border-0 gap-4"
      style={{ borderColor: "var(--bdr-light)" }}>
      <span className="text-sm font-medium shrink-0" style={{ color: "var(--text-faint)" }}>{label}</span>
      <span className={cn("text-sm font-semibold text-right", mono && "font-mono tracking-wide")}
        style={{ color: "var(--text-primary)" }}>
        {value ?? <span style={{ color: "var(--text-disabled)", fontWeight: 400 }}>Not set</span>}
      </span>
    </div>
  );
}

const rolePermissions: Record<string, { permissions: string[]; color: string }> = {
  owner:   { color: "bg-purple-500", permissions: ["Full access to all features", "Manage staff & roles", "View all reports", "Billing & payments", "Menu management"] },
  manager: { color: "bg-blue-600",   permissions: ["Manage orders & tables", "View reports", "Billing & payments", "Menu management", "Staff overview"] },
  cashier: { color: "bg-emerald-600",permissions: ["Process billing & payments", "View all orders", "Table management", "Basic reports"] },
  waiter:  { color: "bg-amber-500",  permissions: ["Take orders (POS)", "View own orders", "Generate bill", "Table assignment"] },
  kitchen: { color: "bg-slate-600",  permissions: ["Kitchen Display System", "Update KOT status", "Mark orders ready"] },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"restaurant" | "roles" | "about">("restaurant");

  const tabs = [
    { key: "restaurant" as const, label: "Restaurant", icon: Building2 },
    { key: "roles"      as const, label: "Roles & Permissions", icon: Shield },
    { key: "about"      as const, label: "About", icon: Info },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-5 space-y-5">

        {/* Header */}
        <div>
          <h1 className="page-title mb-1">
            <span className="page-title-bar" />
            Settings
          </h1>
          <p className="page-subtitle" style={{ paddingLeft: 13 }}>
            Restaurant configuration and system info
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 p-0.5 w-fit rounded"
          style={{ background: "var(--surface-3)", border: "1px solid var(--bdr)" }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all"
              style={{
                borderRadius: "calc(var(--r-md) - 2px)",
                background: activeTab === key ? "var(--surface)"  : "transparent",
                color:      activeTab === key ? "var(--text-primary)" : "var(--text-faint)",
                boxShadow:  activeTab === key ? "var(--shadow-xs)" : "none",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Restaurant tab */}
        {activeTab === "restaurant" && (
          <div className="space-y-4">
            <Section title="Restaurant Information" icon={Building2}>
              <div className="-my-3">
                <InfoRow label="Restaurant Name" value={user?.tenant?.name} />
                <InfoRow label="Email"           value={user?.tenant?.email} />
                <InfoRow label="Phone"           value={user?.tenant?.phone} />
                <InfoRow label="Address"         value={user?.tenant?.address} />
              </div>
            </Section>

            <Section title="Tax & Billing" icon={Hash}>
              <div className="-my-3 mb-4">
                <InfoRow label="GST Number" value={user?.tenant?.gstNumber} mono />
              </div>
              <div className="rounded p-4 space-y-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--bdr)", borderRadius: "var(--r-md)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  GST Rate Configuration
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { rate: "5%",  desc: "Standard food items" },
                    { rate: "12%", desc: "Packaged goods" },
                    { rate: "18%", desc: "Non-veg / premium" },
                  ].map(({ rate, desc }) => (
                    <div key={rate} className="p-3 text-center rounded"
                      style={{ background: "var(--surface)", border: "1px solid var(--bdr)", borderRadius: "var(--r-md)" }}>
                      <p className="text-lg font-black" style={{ color: "var(--brand)" }}>{rate}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  GST rates are set per menu item. Bills show a full GST breakdown (CGST + SGST).
                </p>
              </div>
            </Section>

            <Section title="Receipt & Printing" icon={Printer}>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded"
                  style={{ background: "var(--success-light)", border: "1px solid #A7F3D0", borderRadius: "var(--r-md)" }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--success)" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#065F46" }}>Thermal Print Ready</p>
                    <p className="text-xs" style={{ color: "#047857" }}>
                      80mm receipt with GST breakdown, bill number, and restaurant info
                    </p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Receipts include: Bill number · Table · Items with quantities · Subtotal · GST breakdown · Grand total · Payment method
                </p>
              </div>
            </Section>
          </div>
        )}

        {/* Roles tab */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              RestaurantOS uses role-based access control (RBAC). Each role has specific permissions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(rolePermissions).map(([role, { permissions, color }]) => (
                <div key={role} className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)" }}>
                  <div className={cn("px-5 py-3.5 flex items-center gap-3", color)}>
                    <Shield className="w-4 h-4 text-white" />
                    <span className="font-black text-white capitalize text-sm">{role}</span>
                    {user?.role === role && (
                      <span className="ml-auto text-xs bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <ul className="p-4 space-y-2" style={{ background: "var(--surface)" }}>
                    {permissions.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success)" }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About tab */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <Section title="RestaurantOS" icon={ChefHat}>
              <div className="flex items-center gap-5 mb-5">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)",
                    boxShadow: "var(--shadow-brand)",
                    borderRadius: "var(--r-xl)",
                  }}>
                  <ChefHat className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>RestaurantOS</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Restaurant Management System</p>
                  <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      color: "var(--brand)",
                      background: "var(--brand-light)",
                      border: "1px solid var(--brand-mid)",
                      borderRadius: "var(--r-sm)",
                    }}>
                    v1.0.0
                  </span>
                </div>
              </div>
              <div className="-my-3">
                <InfoRow label="Build"    value="2025 · Production" />
                <InfoRow label="Database" value="PostgreSQL + Drizzle ORM" />
                <InfoRow label="API"      value="Fastify (Node.js)" />
                <InfoRow label="Frontend" value="Next.js 15 App Router" />
                <InfoRow label="Auth"     value="JWT · Role-Based Access" />
              </div>
            </Section>

            <Section title="Features" icon={CheckCircle2}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Multi-role RBAC",
                  "Real-time Kitchen Display (SSE)",
                  "GST breakdown per bill",
                  "Table management",
                  "Split bill support",
                  "KOT printing",
                  "Menu variants & modifiers",
                  "Bill history",
                  "Dashboard analytics",
                  "Waiter assignment",
                  "Offline polling fallback",
                  "Thermal receipt print",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs py-1.5" style={{ color: "var(--text-secondary)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success)" }} />
                    {f}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Support" icon={Clock}>
              <div className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <p>For issues or questions, check the documentation included with your installation package.</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Running locally · Port 3000 (web) · Port 4000 (API)
                </p>
              </div>
            </Section>
          </div>
        )}

        {/* Logged-in card */}
        <div className="rounded-lg p-4 flex items-center gap-4"
          style={{ background: "var(--sb-bg)", borderRadius: "var(--r-lg)" }}>
          <div className={cn(
            "w-10 h-10 rounded flex items-center justify-center text-white font-black text-sm shrink-0",
            rolePermissions[user?.role ?? ""]?.color ?? "bg-slate-600",
          )} style={{ borderRadius: "var(--r-md)" }}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: "var(--sb-text)" }}>
              {user?.email} · <span className="capitalize">{user?.role}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs" style={{ color: "var(--sb-text)" }}>Logged in as</p>
            <p className="text-xs font-bold capitalize" style={{ color: "#60A5FA" }}>{user?.role}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
