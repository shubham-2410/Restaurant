const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
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
    public message: string,
    public data?: unknown
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
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

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: unknown }>("/api/auth/login", { method: "POST", body: data }),
    register: (data: unknown) =>
      request<{ token: string; user: unknown }>("/api/auth/register", { method: "POST", body: data }),
    logout: () => request<void>("/api/auth/logout", { method: "POST" }),
    me: () => request<unknown>("/api/auth/me"),
  },
  tenants: {
    get: () => request<unknown>("/api/tenants/me"),
    update: (data: unknown) => request<unknown>("/api/tenants/me", { method: "PUT", body: data }),
  },
  users: {
    list: () => request<unknown[]>("/api/users"),
    create: (data: unknown) => request<unknown>("/api/users", { method: "POST", body: data }),
    update: (id: number, data: unknown) => request<unknown>(`/api/users/${id}`, { method: "PUT", body: data }),
    delete: (id: number) => request<void>(`/api/users/${id}`, { method: "DELETE" }),
  },
  menu: {
    categories: {
      list: () => request<unknown[]>("/api/menu/categories"),
      create: (data: unknown) => request<unknown>("/api/menu/categories", { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<unknown>(`/api/menu/categories/${id}`, { method: "PUT", body: data }),
      delete: (id: number) => request<void>(`/api/menu/categories/${id}`, { method: "DELETE" }),
    },
    items: {
      list: (params?: { categoryId?: number; available?: boolean }) =>
        request<unknown[]>("/api/menu/items", { params }),
      create: (data: unknown) => request<unknown>("/api/menu/items", { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<unknown>(`/api/menu/items/${id}`, { method: "PUT", body: data }),
      delete: (id: number) => request<void>(`/api/menu/items/${id}`, { method: "DELETE" }),
    },
  },
  tables: {
    list: () => request<unknown[]>("/api/tables"),
    create: (data: unknown) => request<unknown>("/api/tables", { method: "POST", body: data }),
    update: (id: number, data: unknown) => request<unknown>(`/api/tables/${id}`, { method: "PUT", body: data }),
    delete: (id: number) => request<void>(`/api/tables/${id}`, { method: "DELETE" }),
  },
  orders: {
    list: (params?: { status?: string; tableId?: number }) =>
      request<unknown[]>("/api/orders", { params }),
    get: (id: number) => request<unknown>(`/api/orders/${id}`),
    create: (data: unknown) => request<unknown>("/api/orders", { method: "POST", body: data }),
    update: (id: number, data: unknown) => request<unknown>(`/api/orders/${id}`, { method: "PUT", body: data }),
  },
  kot: {
    board: () => request<unknown[]>("/api/kot"),
    updateStatus: (id: number, status: string) =>
      request<unknown>(`/api/kot/${id}/status`, { method: "PATCH", body: { status } }),
    setPriority: (id: number, isPriority: boolean) =>
      request<unknown>(`/api/kot/${id}/priority`, { method: "PATCH", body: { isPriority } }),
  },
  billing: {
    list: (params?: { status?: string }) => request<unknown[]>("/api/billing", { params }),
    get: (id: number) => request<unknown>(`/api/billing/${id}`),
    createForOrder: (orderId: number) =>
      request<unknown>(`/api/billing/order/${orderId}`, { method: "POST" }),
    recordPayment: (id: number, data: unknown) =>
      request<unknown>(`/api/billing/${id}/payment`, { method: "POST", body: data }),
  },
  dashboard: {
    summary: () => request<unknown>("/api/dashboard/summary"),
    topItems: (params?: { period?: string }) => request<unknown>("/api/dashboard/top-items", { params }),
    hourlyRevenue: () => request<unknown>("/api/dashboard/hourly-revenue"),
  },
};