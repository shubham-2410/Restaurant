import { pgTable, serial, integer, varchar, numeric, timestamp, text, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { orders } from "./orders";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "upi", "razorpay"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "partially_paid", "refunded"]);

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  billNumber: varchar("bill_number", { length: 50 }).notNull().unique(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  gstBreakdown: jsonb("gst_breakdown").notNull().default({}),
  gstAmount: numeric("gst_amount", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const billsRelations = relations(bills, ({ one }) => ({
  order: one(orders, { fields: [bills.orderId], references: [orders.id] }),
}));
