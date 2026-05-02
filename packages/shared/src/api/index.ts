import type {
  AuthResponse,
  Bill,
  DashboardSummary,
  Kot,
  MenuItem,
  MenuCategory,
  Order,
  RestaurantTable,
  Tenant,
  User,
} from "../types";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken } = config;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, params } = options;

    let url = `${baseUrl}${path}`;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.set(k, String(v));
      });
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = getToken?.();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (errData as { message?: string }).message ?? res.statusText, errData);
    }

    if (res.status === 204) return null as T;
    return res.json() as Promise<T>;
  }

  return {
    // Auth
    auth: {
      login: (data: { email: string; password: string }) =>
        request<AuthResponse>("/api/auth/login", { method: "POST", body: data }),
      register: (data: unknown) =>
        request<AuthResponse>("/api/auth/register", { method: "POST", body: data }),
      logout: () => request<void>("/api/auth/logout", { method: "POST" }),
      me: () => request<AuthResponse["user"]>("/api/auth/me"),
    },

    // Tenants
    tenants: {
      get: () => request<Tenant>("/api/tenants/me"),
      update: (data: Partial<Tenant>) => request<Tenant>("/api/tenants/me", { method: "PUT", body: data }),
    },

    // Users
    users: {
      list: () => request<User[]>("/api/users"),
      create: (data: unknown) => request<User>("/api/users", { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<User>(`/api/users/${id}`, { method: "PUT", body: data }),
      delete: (id: number) => request<void>(`/api/users/${id}`, { method: "DELETE" }),
    },

    // Menu
    menu: {
      categories: {
        list: () => request<MenuCategory[]>("/api/menu/categories"),
        create: (data: unknown) => request<MenuCategory>("/api/menu/categories", { method: "POST", body: data }),
        update: (id: number, data: unknown) => request<MenuCategory>(`/api/menu/categories/${id}`, { method: "PUT", body: data }),
        delete: (id: number) => request<void>(`/api/menu/categories/${id}`, { method: "DELETE" }),
      },
      items: {
        list: (params?: { categoryId?: number; available?: boolean }) =>
          request<MenuItem[]>("/api/menu/items", { params }),
        create: (data: unknown) => request<MenuItem>("/api/menu/items", { method: "POST", body: data }),
        update: (id: number, data: unknown) => request<MenuItem>(`/api/menu/items/${id}`, { method: "PUT", body: data }),
        delete: (id: number) => request<void>(`/api/menu/items/${id}`, { method: "DELETE" }),
      },
    },

    // Tables
    tables: {
      list: () => request<RestaurantTable[]>("/api/tables"),
      create: (data: unknown) => request<RestaurantTable>("/api/tables", { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<RestaurantTable>(`/api/tables/${id}`, { method: "PUT", body: data }),
      delete: (id: number) => request<void>(`/api/tables/${id}`, { method: "DELETE" }),
    },

    // Orders
    orders: {
      list: (params?: { status?: string; tableId?: number }) =>
        request<Order[]>("/api/orders", { params }),
      get: (id: number) => request<Order>(`/api/orders/${id}`),
      create: (data: unknown) => request<Order>("/api/orders", { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<Order>(`/api/orders/${id}`, { method: "PUT", body: data }),
    },

    // KOT
    kot: {
      board: () => request<Kot[]>("/api/kot"),
      updateStatus: (id: number, status: string) =>
        request<Kot>(`/api/kot/${id}/status`, { method: "PATCH", body: { status } }),
      setPriority: (id: number, isPriority: boolean) =>
        request<Kot>(`/api/kot/${id}/priority`, { method: "PATCH", body: { isPriority } }),
    },

    // Billing
    billing: {
      list: (params?: { status?: string }) => request<Bill[]>("/api/billing", { params }),
      get: (id: number) => request<Bill>(`/api/billing/${id}`),
      createForOrder: (orderId: number) =>
        request<Bill>(`/api/billing/order/${orderId}`, { method: "POST" }),
      recordPayment: (id: number, data: unknown) =>
        request<Bill>(`/api/billing/${id}/payment`, { method: "POST", body: data }),
    },

    // Dashboard
    dashboard: {
      summary: () => request<DashboardSummary>("/api/dashboard/summary"),
      topItems: (params?: { period?: string }) => request<unknown>("/api/dashboard/top-items", { params }),
      hourlyRevenue: () => request<unknown>("/api/dashboard/hourly-revenue"),
    },
  };
}
