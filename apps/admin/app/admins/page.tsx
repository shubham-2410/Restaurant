"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { adminApi, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Admin } from "@restaurant/shared";
import { Plus, Shield, ToggleLeft, ToggleRight, RefreshCcw } from "lucide-react";

interface NewAdminForm {
  name:     string;
  email:    string;
  password: string;
  role:     "super_admin" | "support";
}

const empty: NewAdminForm = { name: "", email: "", password: "", role: "support" };

export default function AdminsPage() {
  const { admin: me }      = useAuth();
  const { success, error } = useToast();

  const [admins,    setAdmins]    = useState<Admin[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState<NewAdminForm>(empty);
  const [errors,    setErrors]    = useState<Partial<NewAdminForm>>({});
  const [saving,    setSaving]    = useState(false);
  const [toggling,  setToggling]  = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.admins.list();
      setAdmins(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validate = (): boolean => {
    const e: Partial<NewAdminForm> = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.email.trim())    e.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await adminApi.admins.create(form);
      success("Admin account created");
      setShowModal(false);
      setForm(empty);
      setErrors({});
      load();
    } catch (e: unknown) {
      error((e as ApiError)?.message ?? "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: Admin) => {
    if (a.id === me?.id) {
      error("You cannot deactivate your own account");
      return;
    }
    setToggling(a.id);
    try {
      await adminApi.admins.setStatus(a.id, !a.isActive);
      success(`${a.name} has been ${!a.isActive ? "activated" : "deactivated"}`);
      load();
    } catch (e: unknown) {
      error((e as ApiError)?.message ?? "Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const set = (field: keyof NewAdminForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Admin Accounts</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage who has access to this admin panel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> New Admin
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <PageLoader text="Loading admins…" />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Admin</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black shrink-0">
                          {a.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {a.name}
                            {a.id === me?.id && (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">you</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={a.role === "super_admin" ? "purple" : "info"}>
                        <Shield className="w-3 h-3" />
                        {a.role === "super_admin" ? "Super Admin" : "Support"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={a.isActive ? "success" : "danger"} dot>
                        {a.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      {a.id !== me?.id && (
                        <button
                          onClick={() => handleToggle(a)}
                          disabled={toggling === a.id}
                          title={a.isActive ? "Deactivate" : "Activate"}
                          className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                          {a.isActive ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create admin modal */}
      <Modal
        open={showModal}
        onClose={() => { if (!saving) { setShowModal(false); setForm(empty); setErrors({}); } }}
        title="Create Admin Account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>Create Admin</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. John Smith"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
          />
          <Input
            label="Email"
            type="email"
            required
            placeholder="john@restaurantos.com"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            required
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
          />
          <Select
            label="Role"
            required
            value={form.role}
            onChange={set("role") as (e: React.ChangeEvent<HTMLSelectElement>) => void}
          >
            <option value="support">Support — can view, cannot modify</option>
            <option value="super_admin">Super Admin — full access</option>
          </Select>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Super Admin</strong> — can create/deactivate restaurants, manage admin accounts, and view all stats.
              <br />
              <strong className="text-slate-700">Support</strong> — read-only access to restaurant details and platform stats.
            </p>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
