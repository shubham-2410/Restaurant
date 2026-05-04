"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { UtensilsCrossed } from "lucide-react";
import { getHome } from "@/lib/rbac";

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
          {[
            "Real-time order & KOT management",
            "Role-based access for all staff",
            "Table management & POS",
            "Billing, GST & revenue reports",
          ].map((f) => (
            <li key={f} className="login-panel__feature">
              <span className="login-panel__feature-dot" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div className="login-card__logo-mobile">
            <div className="login-card__logo-mobile-icon">
              <UtensilsCrossed size={22} color="#fff" />
            </div>
            <span className="login-card__app-name">RestaurantOS</span>
          </div>

          <div className="login-card__header">
            <h1 className="login-card__title">Welcome back</h1>
            <p className="login-card__subtitle">Sign in to your command center</p>
          </div>

          <div className="login-form">
            <form onSubmit={handleSubmit}>
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
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="login-form__error">{error}</p>}

              <button type="submit" className="login-form__submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="login-form__footer">
              New restaurant?{" "}
              <a href="/register">Register here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
