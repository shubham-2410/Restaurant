import { pgTable, serial, integer, boolean, timestamp, pgEnum, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { orders } from "./orders";
import { restaurantTables } from "./tables";
import { menuItems } from "./menu";

export const kotStatusEnum = pgEnum("kot_status", ["pending", "preparing", "ready", "cancelled"]);

export const kots = pgTable("kots", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  tableId: integer("table_id").references(() => restaurantTables.id),
  status: kotStatusEnum("status").notNull().default("pending"),
  isPriority: boolean("is_priority").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kotItems = pgTable("kot_items", {
  id: serial("id").primaryKey(),
  kotId: integer("kot_id").notNull().references(() => kots.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
});

export const kotsRelations = relations(kots, ({ one, many }) => ({
  order: one(orders, { fields: [kots.orderId], references: [orders.id] }),
  table: one(restaurantTables, { fields: [kots.tableId], references: [restaurantTables.id] }),
  items: many(kotItems),
}));

export const kotItemsRelations = relations(kotItems, ({ one }) => ({
  kot: one(kots, { fields: [kotItems.kotId], references: [kots.id] }),
  menuItem: one(menuItems, { fields: [kotItems.menuItemId], references: [menuItems.id] }),
}));
