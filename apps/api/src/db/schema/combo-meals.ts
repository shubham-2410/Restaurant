import { pgTable, serial, integer, text, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const comboMeals = pgTable("combo_meals", {
  id:          serial("id").primaryKey(),
  tenantId:    integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),
  price:       numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl:    text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  items:       jsonb("items").notNull().default("[]"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});
