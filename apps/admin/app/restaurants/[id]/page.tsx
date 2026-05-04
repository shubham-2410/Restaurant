"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { adminApi, ApiError } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { TenantDetail } from "@restaurant/shared";
import {
  ArrowLeft, Store, MapPin, Phone, Mail, FileText,
  CheckCircle2, XCircle, Users, ShoppingBag, IndianRupee,
  CalendarDays, ToggleLeft, ToggleRight,
} from "lucide-react";

const roleColors: Record<string, string> = {
  owner:   "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  cashier: "bg-emerald-100 text-emerald-700",
  waiter:  "bg-amber-100 text-amber-700",
  kitchen: "bg-orange-100 text-orange-700",
};

export default function RestaurantDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { admin } = useAuth();
  const { success, error } = useToast();

  const id = parseInt(params.id as string);

  const [restaurant, setRestaurant] = useState<TenantDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [toggling,   setToggling]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.restaurants.get(id);
      setRestaurant(data);
    } catch {
      router.push("/restaurants");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    if (!restaurant || admin?.role !== "super_admin") return;
    setToggling(true);
    try {
      await adminApi.restaurants.setStatus(restaurant.id, !restaurant.isActive);
      success(`Restaurant ${!restaurant.isActive ? "activated" : "deactivated"}`);
      load();
    } catch (e: unknown) {
      error((e as ApiError)?.message ?? "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageLoader text="Loading restaurant…" />
      </AppLayout>
    );
  }

  if (!restaurant) return null;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Back + header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{restaurant.name}</h1>
              <Badge variant={restaurant.isActive ? "success" : "danger"} dot>
                {restaurant.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">ID #{restaurant.id} · Created {formatDate(restaurant.createdAt)}</p>
          </div>
          {admin?.role === "super_admin" && (
            <Button
              variant={restaurant.isActive ? "danger" : "success"}
              size="sm"
              onClick={handleToggle}
              loading={toggling}
              className="shrink-0"
            >
              {restaurant.isActive ? (
                <><XCircle className="w-4 h-4" /> Deactivate</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Activate</>
              )}
            </Button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users,        color: "text-indigo-600",  bg: "bg-indigo-50",  label: "Staff",          value: restaurant.stats.staffCount },
            { icon: ShoppingBag,  color: "text-blue-600",    bg: "bg-blue-50",    label: "Total Orders",   value: restaurant.stats.totalOrders },
            { icon: IndianRupee,  color: "text-orange-600",  bg: "bg-orange-50",  label: "All-time Revenue", value: formatCurrency(restaurant.stats.totalRevenue) },
            { icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-50", label: "Last 30 Days",   value: formatCurrency(restaurant.stats.last30DaysRevenue) },
          ].map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <p className="text-xl font-black text-slate-900 tabular-nums">{value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-900">Restaurant Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {restaurant.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Address</p>
                  <p className="text-sm text-slate-700">{restaurant.address}</p>
                </div>
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Phone</p>
                  <p className="text-sm text-slate-700">{restaurant.phone}</p>
                </div>
              </div>
            )}
            {restaurant.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Email</p>
                  <p className="text-sm text-slate-700">{restaurant.email}</p>
                </div>
              </div>
            )}
            {restaurant.gstNumber && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">GST Number</p>
                  <p className="text-sm text-slate-700 font-mono">{restaurant.gstNumber}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Staff list */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-900">Staff ({restaurant.staff.length})</h2>
          </div>
          {restaurant.staff.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No staff members yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurant.staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{member.name}</td>
                    <td className="px-4 py-3 text-slate-500">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${roleColors[member.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <ToggleRight className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <ToggleLeft className="w-4 h-4" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(member.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
