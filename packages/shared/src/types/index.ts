// ─── Admin ───────────────────────────────────────────────────────────────────

export type AdminRole = "super_admin" | "support";

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuthResponse {
  token: string;
  admin: Admin;
}

export interface TenantStats {
  users: number;
  orders: number;
  totalRevenue: number;
}

export interface TenantWithStats extends Tenant {
  stats: TenantStats;
}

export interface TenantDetail extends Tenant {
  staff: Pick<User, "id" | "name" | "email" | "role" | "isActive" | "createdAt">[];
  stats: {
    totalOrders: number;
    totalRevenue: number;
    last30DaysRevenue: number;
    staffCount: number;
  };
}

export interface AdminPlatformStats {
  restaurants: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  today: {
    orders: number;
    revenue: number;
  };
  allTime: {
    revenue: number;
  };
  monthlyRevenue: {
    month: string;
    revenue: number;
    orders: number;
  }[];
}

export interface AdminCreateTenantResponse {
  tenant: Tenant;
  owner: Omit<User, "passwordHash">;
  temporaryPassword: string;
}

// ─── Tenant ──────────────────────────────────────────────────────────────────

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "manager" | "cashier" | "waiter" | "kitchen";

export interface User {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithTenant extends User {
  tenant: Tenant;
}

// ─── Menu ────────────────────────────────────────────────────────────────────

export type FoodType = "veg" | "non_veg" | "egg";
export type GstRate = "0" | "5" | "12" | "18" | "28";

export interface MenuCategory {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuVariant {
  id: number;
  menuItemId: number;
  name: string;
  additionalPrice: string;
  isAvailable: boolean;
}

export interface MenuModifier {
  id: number;
  menuItemId: number;
  name: string;
  additionalPrice: string;
  isRequired: boolean;
  description: string | null;
}

export interface MenuItem {
  id: number;
  tenantId: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: string;
  foodType: FoodType;
  gstRate: GstRate;
  isAvailable: boolean;
  imageUrl: string | null;
  category?: MenuCategory;
  variants?: MenuVariant[];
  modifiers?: MenuModifier[];
}

// ─── Table ───────────────────────────────────────────────────────────────────

export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export interface RestaurantTable {
  id: number;
  tenantId: number;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrderId: number | null;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "billed"
  | "cancelled";

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  price: string;
  quantity: number;
  notes: string | null;
  menuItem?: MenuItem;
}

export interface Order {
  id: number;
  tenantId: number;
  tableId: number | null;
  userId: number;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: string;
  gstAmount: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  table?: RestaurantTable;
}

// ─── KOT ─────────────────────────────────────────────────────────────────────

export type KotStatus = "pending" | "preparing" | "ready" | "cancelled";

export interface KotItem {
  id: number;
  kotId: number;
  menuItemId: number;
  name: string;
  quantity: number;
  notes: string | null;
}

export interface Kot {
  id: number;
  tenantId: number;
  orderId: number;
  tableId: number | null;
  status: KotStatus;
  isPriority: boolean;
  createdAt: string;
  updatedAt: string;
  items?: KotItem[];
  order?: Order;
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "upi" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "partially_paid" | "refunded";

export interface GstBreakdownEntry {
  taxable: number;
  gst: number;
}

export interface Bill {
  id: number;
  tenantId: number;
  orderId: number;
  billNumber: string;
  subtotal: string;
  gstBreakdown: Record<string, GstBreakdownEntry>;
  gstAmount: string;
  discount: string;
  total: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
  order?: Order;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: UserWithTenant;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSummary {
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  availableTables: number;
  occupiedTables: number;
  pendingKots: number;
}

export interface TopItem {
  name: string;
  total_qty: number;
  revenue: number;
}

export interface HourlyRevenue {
  hour: number;
  revenue: number;
  orders: number;
}
