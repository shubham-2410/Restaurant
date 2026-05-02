"use client";
import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";
import {
  Building2, Phone, Mail, MapPin, Hash, ChefHat,
  Shield, Info, Printer, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-orange-500" />
        </div>
        <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0 gap-4">
      <span className="text-sm text-slate-400 font-medium shrink-0">{label}</span>
      <span className={cn("text-sm font-semibold text-slate-900 text-right", mono && "font-mono tracking-wide")}>
        {value ?? <span className="text-slate-300 font-normal">Not set</span>}
      </span>
    </div>
  );
}

const rolePermissions: Record<string, { permissions: string[]; color: string }> = {
  owner:   { color: "bg-purple-500", permissions: ["Full access to all features", "Manage staff & roles", "View all reports", "Billing & payments", "Menu management"] },
  manager: { color: "bg-blue-500",   permissions: ["Manage orders & tables", "View reports", "Billing & payments", "Menu management", "Staff overview"] },
  cashier: { color: "bg-emerald-500",permissions: ["Process billing & payments", "View all orders", "Table management", "Basic reports"] },
  waiter:  { color: "bg-amber-500",  permissions: ["Take orders (POS)", "View own orders", "Generate bill", "Table assignment"] },
  kitchen: { color: "bg-orange-500", permissions: ["Kitchen Display System", "Update KOT status", "Mark orders ready"] },
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
            <h1 className="text-xl font-black text-slate-900">Settings</h1>
          </div>
          <p className="text-sm text-slate-500 pl-3.5">Restaurant configuration and system info</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Restaurant tab ── */}
        {activeTab === "restaurant" && (
          <div className="space-y-5">
            <Section title="Restaurant Information" icon={Building2}>
              <div className="-my-3">
                <InfoRow label="Restaurant Name" value={user?.tenant?.name} />
                <InfoRow label="Email"           value={user?.tenant?.email} />
                <InfoRow label="Phone"           value={user?.tenant?.phone} />
                <InfoRow label="Address"         value={user?.tenant?.address} />
              </div>
            </Section>

            <Section title="Tax & Billing" icon={Hash}>
              <div className="-my-3">
                <InfoRow label="GST Number" value={user?.tenant?.gstNumber} mono />
              </div>
              <div className="mt-5 bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Rate Configuration</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { rate: "5%",  desc: "Standard food items" },
                    { rate: "12%", desc: "Packaged goods" },
                    { rate: "18%", desc: "Non-veg / premium" },
                  ].map(({ rate, desc }) => (
                    <div key={rate} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-orange-500">{rate}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  GST rates are set per menu item. Bills show a full GST breakdown (CGST + SGST).
                </p>
              </div>
            </Section>

            <Section title="Receipt & Printing" icon={Printer}>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Thermal Print Ready</p>
                    <p className="text-xs text-emerald-600">80mm receipt with GST breakdown, bill number, and restaurant info</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Receipts include: Bill number · Table · Items with quantities · Subtotal · GST breakdown · Grand total · Payment method
                </p>
              </div>
            </Section>
          </div>
        )}

        {/* ── Roles tab ── */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">RestaurantOS uses role-based access control (RBAC). Each role has specific permissions.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(rolePermissions).map(([role, { permissions, color }]) => (
                <div key={role} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className={cn("px-5 py-3.5 flex items-center gap-3", color)}>
                    <Shield className="w-4 h-4 text-white" />
                    <span className="font-black text-white capitalize text-sm">{role}</span>
                    {user?.role === role && (
                      <span className="ml-auto text-xs bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">You</span>
                    )}
                  </div>
                  <ul className="p-4 space-y-2">
                    {permissions.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── About tab ── */}
        {activeTab === "about" && (
          <div className="space-y-5">
            <Section title="RestaurantOS" icon={ChefHat}>
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">RestaurantOS</h3>
                  <p className="text-sm text-slate-500">Restaurant Management System</p>
                  <span className="inline-block mt-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">v1.0.0</span>
                </div>
              </div>
              <div className="-my-3">
                <InfoRow label="Build" value="2025 · Production" />
                <InfoRow label="Database" value="PostgreSQL + Drizzle ORM" />
                <InfoRow label="API" value="Fastify (Node.js)" />
                <InfoRow label="Frontend" value="Next.js 15 App Router" />
                <InfoRow label="Auth" value="JWT · Role-Based Access" />
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
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-600 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Support" icon={Clock}>
              <div className="space-y-2 text-sm text-slate-500">
                <p>For issues or questions, check the documentation included with your installation package.</p>
                <p className="text-xs text-slate-400">Running locally on Windows · Port 3000 (web) · Port 4000 (API)</p>
              </div>
            </Section>
          </div>
        )}

        {/* Logged in as */}
        <div className="bg-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0",
            rolePermissions[user?.role ?? ""]?.color ?? "bg-slate-600",
          )}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs">{user?.email} · <span className="capitalize">{user?.role}</span></p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Logged in as</p>
            <p className="text-xs font-bold text-orange-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
