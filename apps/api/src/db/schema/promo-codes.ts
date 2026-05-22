import { pgTable, serial, integer, text, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const promoDiscountTypeEnum = pgEnum("promo_discount_type", ["flat", "percent"]);

export const promoCodes = pgTable("promo_codes", {
  id:           serial("id").primaryKey(),
  tenantId:     integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code:         text("code").notNull(),
  description:  text("description"),
  discountType: promoDiscountTypeEnum("discount_type").notNull().default("flat"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: numeric("min_order_value", { precision: 10, scale: 2 }).default("0"),
  maxUses:      integer("max_uses"),
  usedCount:    integer("used_count").notNull().default(0),
  isActive:     boolean("is_active").notNull().default(true),
  expiresAt:    timestamp("expires_at"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});
