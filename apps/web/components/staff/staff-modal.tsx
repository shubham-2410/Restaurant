"use client";
import { useState, useEffect, type ChangeEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { User, UserRole } from "@restaurant/shared";

interface StaffModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user?: User | null;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "waiter", label: "Waiter" },
  { value: "kitchen", label: "Kitchen Staff" },
];

interface StaffForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
}

const INITIAL: StaffForm = {
  name: "",
  email: "",
  password: "",
  role: "waiter",
  phone: "",
  isActive: true,
};

export function StaffModal({ open, onClose, onSaved, user }: StaffModalProps) {
  const { success, error } = useToast();
  const [form, setForm] = useState<StaffForm>(INITIAL);
  const [saving, setSaving] = useState(false);
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        phone: user.phone ?? "",
        isActive: user.isActive,
      });
    } else {
      setForm(INITIAL);
    }
  }, [user, open]);

  const setField = <K extends keyof StaffForm>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value as StaffForm[K] }));

  const handleSave = async () => {
    if (!form.name || !form.email) { error("Name and email are required"); return; }
    if (!isEditing && !form.password) { error("Password is required for new staff"); return; }
    setSaving(true);
    try {
      if (isEditing && user) {
        await api.users.update(user.id, {
          name: form.name,
          role: form.role,
          phone: form.phone || undefined,
          isActive: form.isActive,
        });
        success("Staff member updated");
      } else {
        await api.users.create({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone || undefined,
        });
        success("Staff member added");
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message;
      error(msg ?? "Failed to save staff member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Staff Member" : "Add Staff Member"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {isEditing ? "Save Changes" : "Add Staff"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Full Name"
          required
          value={form.name}
          onChange={setField("name")}
          placeholder="Raj Kumar"
        />
        <Input
          label="Email"
          required
          type="email"
          value={form.email}
          onChange={setField("email")}
          placeholder="raj@restaurant.com"
          disabled={isEditing}
        />
        {!isEditing && (
          <Input
            label="Password"
            required
            type="password"
            value={form.password}
            onChange={setField("password")}
            placeholder="Min 6 characters"
          />
        )}
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={setField("phone")}
          placeholder="+91-9876543210"
        />
        <Select label="Role" required value={form.role} onChange={setField("role")}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
        {isEditing && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="staffActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="staffActive" className="text-sm font-medium text-slate-700">
              Active (can login)
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}
