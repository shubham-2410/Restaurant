import { pgTable, serial, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { restaurantTables } from "./tables";
import { users } from "./users";
import { menuItems } from "./menu";

export const orderTypeEnum = pgEnum("order_type", ["dine_in", "takeaway", "delivery"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending", "confirmed", "preparing", "ready", "served", "billed", "cancelled",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tableId: integer("table_id").references(() => restaurantTables.id),
  userId: integer("user_id").notNull().references(() => users.id),
  orderType: orderTypeEnum("order_type").notNull().default("dine_in"),
  status: orderStatusEnum("status").notNull().default("pending"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  gstAmount: numeric("gst_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
});
