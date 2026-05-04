"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { CreateRestaurantModal } from "@/components/restaurants/create-restaurant-modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { adminApi, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TenantWithStats } from "@restaurant/shared";
import {
  Plus, Search, Store, Users, ShoppingBag, IndianRupee,
  ChevronRight, ToggleLeft, ToggleRight, RefreshCcw,
} from "lucide-react";

export default function RestaurantsPage() {
  const router     = useRouter();
  const { admin }  = useAuth();
  const { success, error } = useToast();

  const [restaurants, setRestaurants] = useState<TenantWithStats[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState<"all" | "active" | "inactive">("all");
  const [showCreate,  setShowCreate]  = useState(false);
  const [toggling,    setToggling]    = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.restaurants.list(
        filter !== "all" ? { status: filter } : undefined,
      );
      setRestaurants(data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const displayed = restaurants.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.phone?.includes(s) ||
      r.slug.includes(s)
    );
  });

  const handleToggle = async (r: TenantWithStats) => {
    if (admin?.role !== "super_admin") {
      error("Only super admins can change restaurant status");
      return;
    }
    setToggling(r.id);
    try {
      await adminApi.restaurants.setStatus(r.id, !r.isActive);
      success(`${r.name} has been ${!r.isActive ? "activated" : "deactivated"}`);
      load();
    } catch (e: unknown) {
      error((e as ApiError)?.message ?? "Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Restaurants</h1>
            <p className="text-sm text-slate-500 mt-1">
              {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""} on the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
            {admin?.role === "super_admin" && (
              <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> New Restaurant
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status filter pills */}
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <PageLoader text="Loading restaurants…" />
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Store className="w-12 h-12 text-slate-300" />
            <p className="font-semibold text-slate-500">No restaurants found</p>
            {admin?.role === "super_admin" && (
              <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Create First Restaurant
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Restaurant</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Staff</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Orders</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Revenue</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/restaurants/${r.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700 font-black text-sm">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{r.name}</p>
                          <p className="text-xs text-slate-400">{r.email ?? r.phone ?? r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={r.isActive ? "success" : "danger"} dot>
                        {r.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {r.stats.users}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        {r.stats.orders}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <IndianRupee className="w-3 h-3 text-slate-400" />
                        {formatCurrency(r.stats.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        {admin?.role === "super_admin" && (
                          <button
                            onClick={() => handleToggle(r)}
                            disabled={toggling === r.id}
                            title={r.isActive ? "Deactivate" : "Activate"}
                            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                          >
                            {r.isActive ? (
                              <ToggleRight className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateRestaurantModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </AppLayout>
  );
}
