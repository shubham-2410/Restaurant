"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserSchema = exports.CreateUserSchema = exports.RecordPaymentSchema = exports.UpdateOrderSchema = exports.CreateOrderSchema = exports.OrderItemSchema = exports.TableSchema = exports.MenuItemSchema = exports.MenuCategorySchema = exports.RegisterSchema = exports.LoginSchema = void 0;
var zod_1 = require("zod");
// ─── Auth ────────────────────────────────────────────────────────────────────
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.RegisterSchema = zod_1.z.object({
    restaurantName: zod_1.z.string().min(2).max(100),
    ownerName: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
});
// ─── Menu ────────────────────────────────────────────────────────────────────
exports.MenuCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().int().default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.MenuItemSchema = zod_1.z.object({
    categoryId: zod_1.z.number().int().positive(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    price: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price"),
    foodType: zod_1.z.enum(["veg", "non_veg", "egg"]),
    gstRate: zod_1.z.enum(["0", "5", "12", "18", "28"]),
    isAvailable: zod_1.z.boolean().default(true),
    imageUrl: zod_1.z.string().url().optional(),
});
// ─── Table ───────────────────────────────────────────────────────────────────
exports.TableSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    capacity: zod_1.z.number().int().positive().max(50),
    status: zod_1.z.enum(["available", "occupied", "reserved", "cleaning"]).default("available"),
});
// ─── Order ───────────────────────────────────────────────────────────────────
exports.OrderItemSchema = zod_1.z.object({
    menuItemId: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().int().positive(),
    notes: zod_1.z.string().optional(),
});
exports.CreateOrderSchema = zod_1.z.object({
    tableId: zod_1.z.number().int().positive().optional(),
    orderType: zod_1.z.enum(["dine_in", "takeaway", "delivery"]),
    items: zod_1.z.array(exports.OrderItemSchema).min(1),
    notes: zod_1.z.string().optional(),
});
exports.UpdateOrderSchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "confirmed", "preparing", "ready", "served", "billed", "cancelled"]).optional(),
    items: zod_1.z.array(exports.OrderItemSchema).optional(),
    notes: zod_1.z.string().optional(),
});
// ─── Billing ─────────────────────────────────────────────────────────────────
exports.RecordPaymentSchema = zod_1.z.object({
    paymentMethod: zod_1.z.enum(["cash", "card", "upi", "razorpay"]),
    discount: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    razorpayOrderId: zod_1.z.string().optional(),
    razorpayPaymentId: zod_1.z.string().optional(),
});
// ─── User ────────────────────────────────────────────────────────────────────
exports.CreateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(["owner", "manager", "cashier", "waiter", "kitchen"]),
    phone: zod_1.z.string().optional(),
});
exports.UpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    role: zod_1.z.enum(["owner", "manager", "cashier", "waiter", "kitchen"]).optional(),
    phone: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
