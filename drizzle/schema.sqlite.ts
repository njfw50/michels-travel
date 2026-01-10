import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Core user table for SQLite
 * Simplified version for email/password authentication
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  loginMethod: text("loginMethod"),
  passwordHash: text("passwordHash"),
  role: text("role").notNull().default("user"), // "user" | "admin"
  
  // Profile photo
  avatarUrl: text("avatarUrl"),
  
  // Payment identifiers
  stripeCustomerId: text("stripeCustomerId"),
  squareCustomerId: text("squareCustomerId"),
  
  // User preferences
  preferredLanguage: text("preferredLanguage").default("en"),
  preferredCurrency: text("preferredCurrency").default("USD"),
  
  // Loyalty program
  loyaltyPoints: integer("loyaltyPoints").default(0),
  loyaltyTier: text("loyaltyTier").default("bronze"), // "bronze" | "silver" | "gold" | "platinum"
  
  // Email preferences
  emailNotifications: integer("emailNotifications", { mode: "boolean" }).default(true),
  priceAlertNotifications: integer("priceAlertNotifications", { mode: "boolean" }).default(true),
  marketingEmails: integer("marketingEmails", { mode: "boolean" }).default(false),
  
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

