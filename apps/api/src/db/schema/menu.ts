import { pgTable, serial, integer, varchar, text, boolean, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { menuVariants, menuModifiers } from "./variants";

export const foodTypeEnum = pgEnum("food_type", ["veg", "non_veg", "egg"]);
export const gstRateEnum = pgEnum("gst_rate", ["0", "5", "12", "18", "28"]);

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => menuCategories.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  foodType: foodTypeEnum("food_type").notNull().default("veg"),
  gstRate: gstRateEnum("gst_rate").notNull().default("5"),
  isAvailable: boolean("is_available").default(true).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  variants: many(menuVariants),
  modifiers: many(menuModifiers),
}));
