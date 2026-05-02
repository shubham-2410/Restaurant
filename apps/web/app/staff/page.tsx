"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import type { User } from "@restaurant/shared";
import { Plus, Pencil, Trash2, Users, Phone, Mail, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StaffModal } from "@/components/staff/staff-modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const roleMeta: Record<string, { label: string; variant: "purple" | "info" | "success" | "warning" | "default"; color: string }> = {
  owner:   { label: "Owner",   variant: "purple",  color: "from-purple-400 to-purple-600" },
  manager: { label: "Manager", variant: "info",    color: "from-blue-400 to-blue-600" },
  cashier: { label: "Cashier", variant: "success", color: "from-emerald-400 to-emerald-600" },
  waiter:  { label: "Waiter",  variant: "warning", color: "from-amber-400 to-amber-600" },
  kitchen: { label: "Kitchen", variant: "default", color: "from-slate-400 to-slate-600" },
};

export default function StaffPage() {
  const { success, error } = useToast();
  const [staff, setStaff] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const load = useCallback(() => {
    api.users.list().then(setStaff).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteUser = async (id: number) => {
    if (!confirm("Remove this staff member? This cannot be undone.")) return;
    try {
      await api.users.delete(id);
      setStaff((prev) => prev.filter((u) => u.id !== id));
      success("Staff member removed");
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? "Failed to remove staff member");
    }
  };

  const active = staff.filter((u) => u.isActive).length;

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
              <h1 className="text-xl font-bold text-slate-900">Staff</h1>
            </div>
            <p className="text-sm text-slate-500 pl-3.5">
              {staff.length} members · <span className="text-emerald-600 font-medium">{active} active</span>
            </p>
          </div>
          <Button variant="primary" onClick={() => { setEditUser(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Staff
          </Button>
        </div>

        {staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff members yet"
            description="Add your team members and assign their roles."
            action={
              <Button variant="primary" onClick={() => { setEditUser(null); setModalOpen(true); }}>
                <Plus className="w-4 h-4" /> Add Staff
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {staff.map((user) => {
              const meta = roleMeta[user.role] ?? roleMeta.waiter;
              return (
                <div
                  key={user.id}
                  className={cn(
                    "bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200",
                    user.isActive ? "border-slate-200" : "border-slate-100 opacity-60",
                  )}
                >
                  {/* Role color bar */}
                  <div className={cn("h-1.5 bg-gradient-to-r", meta.color)} />

                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      {/* Avatar */}
                      <div className={cn(
                        "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm",
                        meta.color,
                      )}>
                        <span className="text-xl font-bold text-white">
                          {user.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate leading-tight">{user.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={meta.variant}>
                            <Shield className="w-2.5 h-2.5 mr-0.5" />
                            {meta.label}
                          </Badge>
                          {!user.isActive && <Badge variant="cancelled">Inactive</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setEditUser(user); setModalOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      {user.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-red-600 hover:bg-red-50 shrink-0"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        user={editUser}
      />
    </AppLayout>
  );
}
