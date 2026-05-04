import { pgTable, serial, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * admin_users — pre-existing table in the DB.
 * Declared here so Drizzle does not drop it during migrations.
 * This is separate from the new `admins` table (platform super-admins).
 */
export const adminUsers = pgTable("admin_users", {
  id:           serial("id").primaryKey(),
  name:         varchar("name", { length: 255 }).notNull(),
  email:        varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role:         varchar("role", { length: 50 }).notNull().default("support"),
  isActive:     boolean("is_active").default(true).notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});
