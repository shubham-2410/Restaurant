"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { UtensilsCrossed, AlertCircle } from "lucide-react";
import { getHome } from "@/lib/rbac";

const features = [
  "Real-time order & KOT management",
  "Role-based access for all staff",
  "Table management & POS billing",
  "Revenue reports & GST invoicing",
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) router.replace(getHome(user.role));
  }, [isAuthenticated, isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      login(res.token, res.user);
      router.push(getHome(res.user.role));
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || isAuthenticated) return null;

  return (
    <div className="login-page">

      {/* ── Left decorative panel ── */}
      <div className="login-panel">
        <div className="login-panel__logo">
          <div className="login-panel__logo-icon">
            <UtensilsCrossed size={20} color="#fff" />
          </div>
          <span className="login-panel__logo-text">RestaurantOS</span>
        </div>

        <div className="login-panel__body">
          <h2 className="login-panel__tagline">
            Your restaurant,<br />
            <span>fully in control.</span>
          </h2>
          <p className="login-panel__desc">
            Manage orders, tables, staff, and billing from one powerful platform built for modern restaurants.
          </p>
        </div>

        <ul className="login-panel__features">
          {features.map((f) => (
            <li key={f} className="login-panel__feature">
              <span className="login-panel__feature-check">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right form side ── */}
      <div className="login-form-side">
        <div className="login-card">

          {/* Mobile-only logo */}
          <div className="login-card__mobile-logo">
            <div className="login-card__mobile-icon">
              <UtensilsCrossed size={22} color="#fff" />
            </div>
            <span className="login-card__mobile-name">RestaurantOS</span>
          </div>

          <div className="login-card__header">
            <h1 className="login-card__title">Welcome back</h1>
            <p className="login-card__subtitle">Sign in to your command center</p>
          </div>

          <div className="login-form">
            <div className="login-form__group">
              <label className="login-form__label">Email address</label>
              <input
                type="email"
                className={`login-form__input${error ? " login-form__input--error" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@restaurant.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="login-form__group">
              <label className="login-form__label">Password</label>
              <input
                type="password"
                className={`login-form__input${error ? " login-form__input--error" : ""}`}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="login-form__error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="login-form__submit"
              disabled={loading}
              type="button"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : "Sign in →"}
            </button>

            <p className="login-form__footer">
              New restaurant?{" "}
              <a href="/register">Create an account</a>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
