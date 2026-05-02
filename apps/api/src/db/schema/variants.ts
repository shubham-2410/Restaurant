import { pgTable, serial, integer, varchar, numeric, boolean, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { menuItems } from "./menu";

export const menuVariants = pgTable("menu_variants", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  additionalPrice: numeric("additional_price", { precision: 10, scale: 2 }).notNull().default("0"),
  isAvailable: boolean("is_available").default(true).notNull(),
});

export const menuModifiers = pgTable("menu_modifiers", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  additionalPrice: numeric("additional_price", { precision: 10, scale: 2 }).notNull().default("0"),
  isRequired: boolean("is_required").default(false).notNull(),
  description: text("description"),
});

export const menuVariantsRelations = relations(menuVariants, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuVariants.menuItemId], references: [menuItems.id] }),
}));

export const menuModifiersRelations = relations(menuModifiers, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuModifiers.menuItemId], references: [menuItems.id] }),
}));
