"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import type { User } from "@restaurant/shared";
import { UserCircle } from "lucide-react";

const roleColors = { owner: "bg-purple-100 text-purple-800", manager: "bg-blue-100 text-blue-800", cashier: "bg-green-100 text-green-800", waiter: "bg-yellow-100 text-yellow-800", kitchen: "bg-orange-100 text-orange-800" };

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  useEffect(() => { api.users.list().then(setStaff).catch(() => {}); }, []);

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Staff</h1>
        <p className="text-slate-500 mb-6">{staff.length} team members</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((user) => (
            <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[user.role]}`}>{user.role}</span>
                <span className={`text-xs font-medium ${user.isActive ? "text-green-600" : "text-red-500"}`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
