import { pgTable, serial, integer, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const tableStatusEnum = pgEnum("table_status", ["available", "occupied", "reserved", "cleaning"]);

export const restaurantTables = pgTable("restaurant_tables", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  capacity: integer("capacity").notNull().default(4),
  status: tableStatusEnum("status").notNull().default("available"),
  currentOrderId: integer("current_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
