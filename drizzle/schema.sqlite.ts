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

/**
 * Leads table for booking requests and quote inquiries
 * Canonical table for SQLite - matches MySQL schema structure
 */
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  type: text("type").notNull(), // "booking" | "quote" | "contact"
  status: text("status").notNull().default("new"), // "new" | "contacted" | "converted" | "closed"
  
  // Flight search details
  origin: text("origin"), // IATA code
  originName: text("originName"),
  destination: text("destination"), // IATA code
  destinationName: text("destinationName"),
  departureDate: text("departureDate"),
  returnDate: text("returnDate"),
  adults: integer("adults"),
  children: integer("children"),
  infants: integer("infants"),
  travelClass: text("travelClass"),
  
  // Selected flight details (stored as JSON string in SQLite)
  flightDetails: text("flightDetails"), // JSON string
  estimatedPrice: text("estimatedPrice"),
  
  // Additional info
  message: text("message"),
  preferredLanguage: text("preferredLanguage").default("en"),
  
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Flight searches log for analytics
 * Canonical table for SQLite - matches MySQL schema structure
 */
export const flightSearches = sqliteTable("flightSearches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  origin: text("origin").notNull(), // IATA code
  destination: text("destination").notNull(), // IATA code
  departureDate: text("departureDate").notNull(),
  returnDate: text("returnDate"),
  adults: integer("adults").notNull(),
  children: integer("children"),
  infants: integer("infants"),
  travelClass: text("travelClass"),
  resultsCount: integer("resultsCount"),
  lowestPrice: text("lowestPrice"),
  searchedAt: integer("searchedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type FlightSearch = typeof flightSearches.$inferSelect;
export type InsertFlightSearch = typeof flightSearches.$inferInsert;

/**
 * Orders table for flight purchases
 * Canonical table for SQLite - stores order attempts and status
 */
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  offerId: text("offerId").notNull(), // Duffel offer ID
  duffelOrderId: text("duffelOrderId"), // Duffel order ID after creation
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // "pending" | "processing" | "confirmed" | "failed" | "cancelled"
  customerEmail: text("customerEmail").notNull(),
  customerName: text("customerName"),
  paymentIntentId: text("paymentIntentId"), // Stripe PaymentIntent ID
  paymentStatus: text("paymentStatus"), // "pending" | "succeeded" | "failed"
  idempotencyKey: text("idempotencyKey").notNull().unique(), // Prevent double charges
  passengerDetails: text("passengerDetails"), // JSON string
  flightDetails: text("flightDetails"), // JSON string
  errorMessage: text("errorMessage"), // Error message if order failed
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

