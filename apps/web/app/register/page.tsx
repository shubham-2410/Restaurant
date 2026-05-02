"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { UtensilsCrossed } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ restaurantName: "", ownerName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.register(form);
      login((res as { token: string; user: typeof res }).token, (res as { token: string; user: typeof res }).user as never);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900 text-orange-400 p-3 rounded-2xl mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">RestaurantOS</h1>
          <p className="text-slate-500 mt-1">Register your restaurant</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "restaurantName", label: "Restaurant Name", type: "text", placeholder: "Spice Garden" },
              { key: "ownerName", label: "Your Name", type: "text", placeholder: "Raj Kumar" },
              { key: "email", label: "Email", type: "email", placeholder: "owner@restaurant.com" },
              { key: "password", label: "Password", type: "password", placeholder: "Min 6 characters" },
              { key: "phone", label: "Phone (optional)", type: "tel", placeholder: "+91-9876543210" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  required={key !== "phone"}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-slate-900 font-medium hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
