"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { AdminCreateTenantResponse } from "@restaurant/shared";
import { Copy, CheckCircle2, Store } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Phase = "form" | "success";

interface FormData {
  restaurantName: string;
  ownerName:      string;
  ownerEmail:     string;
  ownerPhone:     string;
  email:          string;
  phone:          string;
  address:        string;
  gstNumber:      string;
}

const empty: FormData = {
  restaurantName: "",
  ownerName:      "",
  ownerEmail:     "",
  ownerPhone:     "",
  email:          "",
  phone:          "",
  address:        "",
  gstNumber:      "",
};

export function CreateRestaurantModal({ open, onClose, onCreated }: Props) {
  const { success, error } = useToast();
  const [form, setForm]       = useState<FormData>(empty);
  const [errors, setErrors]   = useState<Partial<FormData>>({});
  const [saving, setSaving]   = useState(false);
  const [phase, setPhase]     = useState<Phase>("form");
  const [result, setResult]   = useState<AdminCreateTenantResponse | null>(null);
  const [copied, setCopied]   = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.restaurantName.trim()) e.restaurantName = "Restaurant name is required";
    if (!form.ownerName.trim())      e.ownerName      = "Owner name is required";
    if (!form.ownerEmail.trim())     e.ownerEmail     = "Owner email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) e.ownerEmail = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = await adminApi.restaurants.create({
        restaurantName: form.restaurantName.trim(),
        ownerName:      form.ownerName.trim(),
        ownerEmail:     form.ownerEmail.trim(),
        ownerPhone:     form.ownerPhone.trim() || undefined,
        email:          form.email.trim() || undefined,
        phone:          form.phone.trim() || undefined,
        address:        form.address.trim() || undefined,
        gstNumber:      form.gstNumber.trim() || undefined,
      });
      setResult(data);
      setPhase("success");
      onCreated();
    } catch (e: unknown) {
      error((e as { message?: string })?.message ?? "Failed to create restaurant");
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = async () => {
    if (!result) return;
    const text = `RestaurantOS Login Credentials\n\nRestaurant: ${result.tenant.name}\nEmail: ${result.owner.email}\nTemporary Password: ${result.temporaryPassword}\n\nPlease login and change your password immediately.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    success("Credentials copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (saving) return;
    setForm(empty);
    setErrors({});
    setPhase("form");
    setResult(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={phase === "success" ? "Restaurant Created!" : "Create New Restaurant"}
      size="lg"
      footer={
        phase === "success" ? (
          <Button variant="primary" onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>
              Create Restaurant
            </Button>
          </>
        )
      }
    >
      {/* ── Success state ── */}
      {phase === "success" && result && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Store className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{result.tenant.name}</p>
              <p className="text-sm text-slate-500 mt-0.5">has been created successfully</p>
            </div>
          </div>

          {/* Credentials card */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Share these credentials with the restaurant owner
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Login Email</span>
                <span className="font-bold text-slate-900">{result.owner.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Temporary Password</span>
                <span className="font-mono font-black text-indigo-700 text-base tracking-wider">
                  {result.temporaryPassword}
                </span>
              </div>
            </div>
            <p className="text-xs text-amber-600">
              This password is shown only once. Copy it now.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={copyCredentials}
          >
            {copied ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Copied!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy Credentials</>
            )}
          </Button>
        </div>
      )}

      {/* ── Form ── */}
      {phase === "form" && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Restaurant Info</p>
            <div className="space-y-3">
              <Input
                label="Restaurant Name"
                required
                placeholder="e.g. Spice Garden Restaurant"
                value={form.restaurantName}
                onChange={set("restaurantName")}
                error={errors.restaurantName}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone" placeholder="+91-9876543210" value={form.phone} onChange={set("phone")} />
                <Input label="Email" type="email" placeholder="info@restaurant.com" value={form.email} onChange={set("email")} />
              </div>
              <Input label="GST Number" placeholder="29ABCDE1234F1Z5" value={form.gstNumber} onChange={set("gstNumber")} />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, State, PIN"
                  value={form.address}
                  onChange={set("address")}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Owner Account</p>
            <div className="space-y-3">
              <Input
                label="Owner Name"
                required
                placeholder="e.g. Raj Kumar"
                value={form.ownerName}
                onChange={set("ownerName")}
                error={errors.ownerName}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Owner Email"
                  type="email"
                  required
                  placeholder="owner@restaurant.com"
                  value={form.ownerEmail}
                  onChange={set("ownerEmail")}
                  error={errors.ownerEmail}
                />
                <Input
                  label="Owner Phone"
                  placeholder="+91-9876543210"
                  value={form.ownerPhone}
                  onChange={set("ownerPhone")}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              A secure temporary password will be auto-generated. You must share it with the owner.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
