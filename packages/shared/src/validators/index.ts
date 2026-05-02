import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  restaurantName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ─── Menu ────────────────────────────────────────────────────────────────────

export const MenuCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const MenuItemSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  foodType: z.enum(["veg", "non_veg", "egg"]),
  gstRate: z.enum(["0", "5", "12", "18", "28"]),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const MenuVariantSchema = z.object({
  name: z.string().min(1).max(100),
  additionalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").default("0"),
  isAvailable: z.boolean().default(true),
});

export const MenuModifierSchema = z.object({
  name: z.string().min(1).max(100),
  additionalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").default("0"),
  isRequired: z.boolean().default(false),
  description: z.string().optional(),
});

// ─── Table ───────────────────────────────────────────────────────────────────

export const TableSchema = z.object({
  name: z.string().min(1).max(50),
  capacity: z.number().int().positive().max(50),
  status: z.enum(["available", "occupied", "reserved", "cleaning"]).default("available"),
});

// ─── Order ───────────────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  tableId: z.number().int().positive().optional(),
  orderType: z.enum(["dine_in", "takeaway", "delivery"]),
  items: z.array(OrderItemSchema).min(1),
  notes: z.string().optional(),
  assignedUserId: z.number().int().positive().optional(),
});

export const UpdateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "served", "billed", "cancelled"]).optional(),
  notes: z.string().optional(),
  assignedUserId: z.number().int().positive().optional(),
});

// ─── Billing ─────────────────────────────────────────────────────────────────

export const RecordPaymentSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "upi", "razorpay"]),
  discount: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
});

// ─── User ────────────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["owner", "manager", "cashier", "waiter", "kitchen"]),
  phone: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["owner", "manager", "cashier", "waiter", "kitchen"]).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type MenuCategoryInput = z.infer<typeof MenuCategorySchema>;
export type MenuItemInput = z.infer<typeof MenuItemSchema>;
export type MenuVariantInput = z.infer<typeof MenuVariantSchema>;
export type MenuModifierInput = z.infer<typeof MenuModifierSchema>;
export type TableInput = z.infer<typeof TableSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
