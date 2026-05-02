export const API_VERSION = "v1";

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "billed",
  "cancelled",
] as const;

export const KOT_STATUSES = ["pending", "preparing", "ready", "cancelled"] as const;

export const TABLE_STATUSES = ["available", "occupied", "reserved", "cleaning"] as const;

export const USER_ROLES = ["owner", "manager", "cashier", "waiter", "kitchen"] as const;

export const PAYMENT_METHODS = ["cash", "card", "upi", "razorpay"] as const;

export const FOOD_TYPES = ["veg", "non_veg", "egg"] as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
} as const;
