"use client";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <AppLayout>
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-500 mb-8">Manage your restaurant settings</p>
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Restaurant Info</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Restaurant Name", value: user?.tenant?.name },
              { label: "Email", value: user?.tenant?.email },
              { label: "Phone", value: user?.tenant?.phone },
              { label: "GST Number", value: user?.tenant?.gstNumber },
              { label: "Address", value: user?.tenant?.address },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-slate-900">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
