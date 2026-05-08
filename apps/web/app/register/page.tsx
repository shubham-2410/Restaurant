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
      login(
        (res as { token: string; user: typeof res }).token,
        (res as { token: string; user: typeof res }).user as never,
      );
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--page-bg)" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "var(--sb-bg)", borderRadius: "var(--r-xl)" }}>
            <UtensilsCrossed className="w-6 h-6" style={{ color: "#60A5FA" }} />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            RestaurantOS
          </h1>
          <p className="mt-1" style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
            Register your restaurant
          </p>
        </div>

        <div className="rounded-xl shadow-sm p-7"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--bdr)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-lg)",
          }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "restaurantName", label: "Restaurant Name", type: "text",     placeholder: "Spice Garden" },
              { key: "ownerName",      label: "Your Name",       type: "text",     placeholder: "Raj Kumar" },
              { key: "email",          label: "Email",           type: "email",    placeholder: "owner@restaurant.com" },
              { key: "password",       label: "Password",        type: "password", placeholder: "Min 6 characters" },
              { key: "phone",          label: "Phone (optional)", type: "tel",     placeholder: "+91-9876543210" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  required={key !== "phone"}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: "1px solid var(--bdr)",
                    borderRadius: "var(--r-md)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            ))}
            {error && (
              <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: "var(--brand)",
                borderRadius: "var(--r-md)",
                marginTop: 4,
              }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <a href="/login" className="font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
