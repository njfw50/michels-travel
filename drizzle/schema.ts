import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leads table for booking requests and quote inquiries
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  type: mysqlEnum("type", ["booking", "quote", "contact"]).notNull(),
  status: mysqlEnum("status", ["new", "contacted", "converted", "closed"]).default("new").notNull(),
  
  // Flight search details
  origin: varchar("origin", { length: 10 }),
  originName: varchar("originName", { length: 255 }),
  destination: varchar("destination", { length: 10 }),
  destinationName: varchar("destinationName", { length: 255 }),
  departureDate: varchar("departureDate", { length: 20 }),
  returnDate: varchar("returnDate", { length: 20 }),
  adults: int("adults"),
  children: int("children"),
  infants: int("infants"),
  travelClass: varchar("travelClass", { length: 50 }),
  
  // Selected flight details
  flightDetails: json("flightDetails"),
  estimatedPrice: varchar("estimatedPrice", { length: 50 }),
  
  // Additional info
  message: text("message"),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Flight searches log for analytics
 */
export const flightSearches = mysqlTable("flightSearches", {
  id: int("id").autoincrement().primaryKey(),
  origin: varchar("origin", { length: 10 }).notNull(),
  destination: varchar("destination", { length: 10 }).notNull(),
  departureDate: varchar("departureDate", { length: 20 }).notNull(),
  returnDate: varchar("returnDate", { length: 20 }),
  adults: int("adults").notNull(),
  children: int("children"),
  infants: int("infants"),
  travelClass: varchar("travelClass", { length: 50 }),
  resultsCount: int("resultsCount"),
  lowestPrice: varchar("lowestPrice", { length: 50 }),
  searchedAt: timestamp("searchedAt").defaultNow().notNull(),
});

export type FlightSearch = typeof flightSearches.$inferSelect;
export type InsertFlightSearch = typeof flightSearches.$inferInsert;

/**
 * Chat conversations for the travel chatbot
 */
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  messages: json("messages").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;