import { pgTable, serial, integer, text, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const dayEndReconciliations = pgTable("day_end_reconciliations", {
  id:                serial("id").primaryKey(),
  tenantId:          integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  closedByUserId:    integer("closed_by_user_id").notNull().references(() => users.id),
  date:              date("date").notNull(),
  totalOrders:       integer("total_orders").notNull().default(0),
  totalRevenue:      numeric("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  cashRevenue:       numeric("cash_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  cardRevenue:       numeric("card_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  upiRevenue:        numeric("upi_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  razorpayRevenue:   numeric("razorpay_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  totalGst:          numeric("total_gst", { precision: 10, scale: 2 }).notNull().default("0"),
  totalDiscount:     numeric("total_discount", { precision: 10, scale: 2 }).notNull().default("0"),
  complimentaryCount:integer("complimentary_count").notNull().default(0),
  notes:             text("notes"),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
});
