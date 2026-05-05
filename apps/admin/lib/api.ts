import type {
  Admin,
  AdminAuthResponse,
  AdminPlatformStats,
  TenantWithStats,
  TenantDetail,
  AdminCreateTenantResponse,
  Tenant,
} from "@restaurant/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
    const qs = query.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (errData as { message?: string }).message ?? res.statusText,
      errData,
    );
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const adminApi = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: {
    login: (data: { email: string; password: string }) =>
      request<AdminAuthResponse>("/api/admin/auth/login", { method: "POST", body: data }),
    me: () =>
      request<Admin>("/api/admin/auth/me"),
  },

  // ── Platform Stats ───────────────────────────────────────────────────────────
  stats: {
    get: () => request<AdminPlatformStats>("/api/admin/stats"),
  },

  // ── Restaurants (Tenants) ────────────────────────────────────────────────────
  restaurants: {
    list: (params?: { search?: string; status?: "active" | "inactive" }) =>
      request<TenantWithStats[]>("/api/admin/tenants", { params }),

    get: (id: number) =>
      request<TenantDetail>(`/api/admin/tenants/${id}`),

    create: (data: unknown) =>
      request<AdminCreateTenantResponse>("/api/admin/tenants", { method: "POST", body: data }),

    update: (id: number, data: unknown) =>
      request<Tenant>(`/api/admin/tenants/${id}`, { method: "PUT", body: data }),

    setStatus: (id: number, isActive: boolean) =>
      request<Tenant>(`/api/admin/tenants/${id}/status`, {
        method: "PATCH",
        body: { isActive },
      }),
  },

  // ── Admin Accounts ───────────────────────────────────────────────────────────
  admins: {
    list: () =>
      request<Admin[]>("/api/admin/admins"),

    create: (data: unknown) =>
      request<Admin>("/api/admin/admins", { method: "POST", body: data }),

    setStatus: (id: number, isActive: boolean) =>
      request<Admin>(`/api/admin/admins/${id}/status`, {
        method: "PATCH",
        body: { isActive },
      }),

    update: (id: number, data: unknown) =>
      request<Admin>(`/api/admin/admins/${id}`, { method: "PUT", body: data }),
  },
};
