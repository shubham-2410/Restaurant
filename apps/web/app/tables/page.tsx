"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import type { RestaurantTable } from "@restaurant/shared";
import { Users } from "lucide-react";

const statusColors = {
  available: "bg-green-100 border-green-300 text-green-800",
  occupied: "bg-red-100 border-red-300 text-red-800",
  reserved: "bg-yellow-100 border-yellow-300 text-yellow-800",
  cleaning: "bg-blue-100 border-blue-300 text-blue-800",
};

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);

  const load = () => api.tables.list().then(setTables).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, []);

  const changeStatus = async (id: number, status: RestaurantTable["status"]) => {
    await api.tables.update(id, { status });
    load();
  };

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Tables</h1>
        <p className="text-slate-500 mb-6">
          {tables.filter((t) => t.status === "available").length} available · {tables.filter((t) => t.status === "occupied").length} occupied
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`border-2 rounded-xl p-4 ${statusColors[table.status]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{table.name}</h3>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="w-4 h-4" />
                  {table.capacity}
                </div>
              </div>
              <p className="text-sm font-medium capitalize mb-3">{table.status}</p>
              <select
                value={table.status}
                onChange={(e) => changeStatus(table.id, e.target.value as RestaurantTable["status"])}
                className="w-full text-xs border border-current rounded px-1 py-1 bg-transparent"
              >
                {["available", "occupied", "reserved", "cleaning"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
