import type {
  AuthResponse, Bill, DashboardSummary, HourlyRevenue, Kot,
  MenuItem, MenuCategory, MenuVariant, MenuModifier,
  Order, RestaurantTable, TopItem, User, UserWithTenant,
} from "@restaurant/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
  constructor(public status: number, public override message: string, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;
  let url = `${API_URL}${path}`;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) query.set(k, String(v)); });
    const qs = query.toString();
    if (qs) url += `?${qs}`;
  }

  // Only set Content-Type when we actually have a body to send.
  // Sending Content-Type: application/json with an empty body causes
  // Fastify to return 400 "Body cannot be empty when content-type is set".
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
    throw new ApiError(res.status, (errData as { message?: string }).message ?? res.statusText, errData);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login:    (data: { email: string; password: string }) => request<AuthResponse>("/api/auth/login", { method: "POST", body: data }),
    register: (data: unknown) => request<AuthResponse>("/api/auth/register", { method: "POST", body: data }),
    logout:   () => request<void>("/api/auth/logout", { method: "POST" }),
    me:       () => request<UserWithTenant>("/api/auth/me"),
  },
  users: {
    list:   () => request<User[]>("/api/users"),
    me:     () => request<User>("/api/users/me"),
    create: (data: unknown) => request<User>("/api/users", { method: "POST", body: data }),
    update: (id: number, data: unknown) => request<User>(`/api/users/${id}`, { method: "PUT", body: data }),
    delete: (id: number) => request<void>(`/api/users/${id}`, { method: "DELETE" }),
  },
  menu: {
    categories: {
      list:   () => request<MenuCategory[]>("/api/menu/categories"),
      create: (data: unknown) => request<MenuCategory>("/api/menu/categories", { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<MenuCategory>(`/api/menu/categories/${id}`, { method: "PUT", body: data }),
      delete: (id: number) => request<void>(`/api/menu/categories/${id}`, { method: "DELETE" }),
    },
    items: {
      list:            (params?: { categoryId?: number; available?: boolean }) => request<MenuItem[]>("/api/menu/items", { params }),
      create:          (data: unknown) => request<MenuItem>("/api/menu/items", { method: "POST", body: data }),
      update:          (id: number, data: unknown) => request<MenuItem>(`/api/menu/items/${id}`, { method: "PUT", body: data }),
      setAvailability: (id: number, isAvailable: boolean) => request<MenuItem>(`/api/menu/items/${id}/availability`, { method: "PATCH", body: { isAvailable } }),
      delete:          (id: number) => request<void>(`/api/menu/items/${id}`, { method: "DELETE" }),
    },
    variants: {
      list:   (itemId: number) => request<MenuVariant[]>(`/api/menu/items/${itemId}/variants`),
      create: (itemId: number, data: unknown) => request<MenuVariant>(`/api/menu/items/${itemId}/variants`, { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<MenuVariant>(`/api/menu/variants/${id}`, { method: "PUT", body: data }),
      delete: (id: number) => request<void>(`/api/menu/variants/${id}`, { method: "DELETE" }),
    },
    modifiers: {
      list:   (itemId: number) => request<MenuModifier[]>(`/api/menu/items/${itemId}/modifiers`),
      create: (itemId: number, data: unknown) => request<MenuModifier>(`/api/menu/items/${itemId}/modifiers`, { method: "POST", body: data }),
      update: (id: number, data: unknown) => request<MenuModifier>(`/api/menu/modifiers/${id}`, { method: "PUT", body: data }),
      delete: (id: number) => request<void>(`/api/menu/modifiers/${id}`, { method: "DELETE" }),
    },
  },
  tables: {
    list:   () => request<RestaurantTable[]>("/api/tables"),
    create: (data: unknown) => request<RestaurantTable>("/api/tables", { method: "POST", body: data }),
    update: (id: number, data: unknown) => request<RestaurantTable>(`/api/tables/${id}`, { method: "PUT", body: data }),
    delete: (id: number) => request<void>(`/api/tables/${id}`, { method: "DELETE" }),
  },
  orders: {
    list:          (params?: { status?: string; tableId?: number }) => request<Order[]>("/api/orders", { params }),
    get:           (id: number) => request<Order>(`/api/orders/${id}`),
    create:        (data: unknown) => request<Order>("/api/orders", { method: "POST", body: data }),
    update:        (id: number, data: unknown) => request<Order>(`/api/orders/${id}`, { method: "PUT", body: data }),
    assignWaiter:  (id: number, assignedUserId: number) => request<Order>(`/api/orders/${id}`, { method: "PUT", body: { assignedUserId } }),
    transferTable: (id: number, newTableId: number) => request<Order>(`/api/orders/${id}/transfer-table`, { method: "POST", body: { newTableId } }),
    void:          (id: number) => request<Order>(`/api/orders/${id}/void`, { method: "POST" }),
  },
  kot: {
    board:        () => request<Kot[]>("/api/kot"),
    updateStatus: (id: number, status: string) => request<Kot>(`/api/kot/${id}/status`, { method: "PATCH", body: { status } }),
    setPriority:  (id: number, isPriority: boolean) => request<Kot>(`/api/kot/${id}/priority`, { method: "PATCH", body: { isPriority } }),
  },
  billing: {
    list:           (params?: { status?: string }) => request<Bill[]>("/api/billing", { params }),
    get:            (id: number) => request<Bill>(`/api/billing/${id}`),
    pendingOrders:  () => request<Order[]>("/api/billing/pending-orders"),
    // No body needed — do NOT pass body:undefined here, just omit body entirely
    createForOrder: (orderId: number) => request<Bill>(`/api/billing/order/${orderId}`, { method: "POST" }),
    recordPayment:  (id: number, data: unknown) => request<Bill>(`/api/billing/${id}/payment`, { method: "POST", body: data }),
    void:           (id: number) => request<Bill>(`/api/billing/${id}/void`, { method: "POST" }),
  },
  dashboard: {
    summary:       () => request<DashboardSummary>("/api/dashboard/summary"),
    topItems:      () => request<TopItem[]>("/api/dashboard/top-items"),
    hourlyRevenue: () => request<HourlyRevenue[]>("/api/dashboard/hourly-revenue"),
  },
};

export function createSseConnection(onMessage: (data: unknown) => void): () => void {
  const token = getToken();
  if (!token) return () => {};
  const sseBase = API_URL || window.location.origin;
  const es = new EventSource(`${sseBase}/api/sse/events?token=${encodeURIComponent(token)}`);
  es.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
  es.onerror = () => { es.close(); };
  return () => es.close();
}
