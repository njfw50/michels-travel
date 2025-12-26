import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with traveler profile information.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Profile photo
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  
  // Payment identifiers
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  squareCustomerId: varchar("squareCustomerId", { length: 255 }),
  
  // User preferences
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  preferredCurrency: varchar("preferredCurrency", { length: 3 }).default("USD"),
  
  // Loyalty program
  loyaltyPoints: int("loyaltyPoints").default(0),
  loyaltyTier: mysqlEnum("loyaltyTier", ["bronze", "silver", "gold", "platinum"]).default("bronze"),
  
  // Email preferences
  emailNotifications: boolean("emailNotifications").default(true),
  priceAlertNotifications: boolean("priceAlertNotifications").default(true),
  marketingEmails: boolean("marketingEmails").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User traveler profiles - store passport and document info
 */
export const travelerProfiles = mysqlTable("travelerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Basic info
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  middleName: varchar("middleName", { length: 100 }),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  nationality: varchar("nationality", { length: 100 }),
  
  // Contact
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  
  // Document info (encrypted storage recommended)
  documentType: mysqlEnum("documentType", ["passport", "id_card", "drivers_license"]).default("passport"),
  documentNumber: varchar("documentNumber", { length: 100 }),
  documentCountry: varchar("documentCountry", { length: 100 }),
  documentExpiry: varchar("documentExpiry", { length: 20 }),
  
  // Travel preferences
  seatPreference: mysqlEnum("seatPreference", ["window", "aisle", "middle", "no_preference"]).default("no_preference"),
  mealPreference: mysqlEnum("mealPreference", ["regular", "vegetarian", "vegan", "halal", "kosher", "gluten_free", "no_preference"]).default("no_preference"),
  specialAssistance: text("specialAssistance"),
  
  // Relationship to main user
  relationship: mysqlEnum("relationship", ["self", "spouse", "child", "parent", "sibling", "friend", "colleague", "other"]).default("self"),
  
  // Is this the primary profile?
  isPrimary: boolean("isPrimary").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TravelerProfile = typeof travelerProfiles.$inferSelect;
export type InsertTravelerProfile = typeof travelerProfiles.$inferInsert;

/**
 * Frequent flyer programs linked to users
 */
export const frequentFlyerPrograms = mysqlTable("frequentFlyerPrograms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  airlineCode: varchar("airlineCode", { length: 10 }).notNull(),
  airlineName: varchar("airlineName", { length: 100 }).notNull(),
  memberNumber: varchar("memberNumber", { length: 100 }).notNull(),
  tierStatus: varchar("tierStatus", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FrequentFlyerProgram = typeof frequentFlyerPrograms.$inferSelect;
export type InsertFrequentFlyerProgram = typeof frequentFlyerPrograms.$inferInsert;

/**
 * User travel preferences
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Flight preferences
  preferredAirlines: json("preferredAirlines"), // Array of airline codes
  avoidedAirlines: json("avoidedAirlines"),
  preferredCabinClass: mysqlEnum("preferredCabinClass", ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  maxStops: int("maxStops").default(2),
  preferredDepartureTime: mysqlEnum("preferredDepartureTime", ["early_morning", "morning", "afternoon", "evening", "night", "any"]).default("any"),
  
  // Airport preferences
  homeAirports: json("homeAirports"), // Array of airport codes
  preferredAlliances: json("preferredAlliances"), // Star Alliance, OneWorld, SkyTeam
  
  // Budget preferences
  budgetRange: mysqlEnum("budgetRange", ["budget", "moderate", "premium", "luxury"]).default("moderate"),
  
  // Notification preferences
  priceDropThreshold: int("priceDropThreshold").default(10), // Percentage drop to notify
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Saved/favorite routes for quick access
 */
export const savedRoutes = mysqlTable("savedRoutes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  origin: varchar("origin", { length: 10 }).notNull(),
  originName: varchar("originName", { length: 255 }),
  destination: varchar("destination", { length: 10 }).notNull(),
  destinationName: varchar("destinationName", { length: 255 }),
  
  // Optional default settings
  preferredCabinClass: varchar("preferredCabinClass", { length: 50 }),
  typicalTravelers: int("typicalTravelers").default(1),
  
  // Usage stats
  searchCount: int("searchCount").default(0),
  lastSearched: timestamp("lastSearched"),
  
  // Nickname for the route
  nickname: varchar("nickname", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedRoute = typeof savedRoutes.$inferSelect;
export type InsertSavedRoute = typeof savedRoutes.$inferInsert;

/**
 * Price alerts for specific routes
 */
export const priceAlerts = mysqlTable("priceAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  origin: varchar("origin", { length: 10 }).notNull(),
  originName: varchar("originName", { length: 255 }),
  destination: varchar("destination", { length: 10 }).notNull(),
  destinationName: varchar("destinationName", { length: 255 }),
  
  // Date range for the alert
  departureDateStart: varchar("departureDateStart", { length: 20 }),
  departureDateEnd: varchar("departureDateEnd", { length: 20 }),
  returnDateStart: varchar("returnDateStart", { length: 20 }),
  returnDateEnd: varchar("returnDateEnd", { length: 20 }),
  isFlexibleDates: boolean("isFlexibleDates").default(true),
  
  // Passengers
  adults: int("adults").default(1),
  children: int("children").default(0),
  infants: int("infants").default(0),
  cabinClass: varchar("cabinClass", { length: 50 }).default("ECONOMY"),
  
  // Price threshold
  targetPrice: int("targetPrice"), // in cents
  currentLowestPrice: int("currentLowestPrice"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Alert status
  isActive: boolean("isActive").default(true),
  lastChecked: timestamp("lastChecked"),
  lastNotified: timestamp("lastNotified"),
  notificationCount: int("notificationCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

/**
 * User search history with detailed tracking
 */
export const userSearchHistory = mysqlTable("userSearchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }),
  
  origin: varchar("origin", { length: 10 }).notNull(),
  originName: varchar("originName", { length: 255 }),
  destination: varchar("destination", { length: 10 }).notNull(),
  destinationName: varchar("destinationName", { length: 255 }),
  departureDate: varchar("departureDate", { length: 20 }).notNull(),
  returnDate: varchar("returnDate", { length: 20 }),
  
  adults: int("adults").default(1),
  children: int("children").default(0),
  infants: int("infants").default(0),
  cabinClass: varchar("cabinClass", { length: 50 }),
  
  // Search results summary
  resultsCount: int("resultsCount"),
  lowestPrice: int("lowestPrice"), // in cents
  averagePrice: int("averagePrice"),
  currency: varchar("currency", { length: 3 }),
  
  // Filters applied
  filtersApplied: json("filtersApplied"),
  
  // User interaction
  viewedFlights: int("viewedFlights").default(0),
  selectedFlightIndex: int("selectedFlightIndex"),
  convertedToBooking: boolean("convertedToBooking").default(false),
  
  searchedAt: timestamp("searchedAt").defaultNow().notNull(),
});

export type UserSearchHistory = typeof userSearchHistory.$inferSelect;
export type InsertUserSearchHistory = typeof userSearchHistory.$inferInsert;

/**
 * Flight price cache for faster searches
 */
export const flightPriceCache = mysqlTable("flightPriceCache", {
  id: int("id").autoincrement().primaryKey(),
  
  // Route
  origin: varchar("origin", { length: 10 }).notNull(),
  destination: varchar("destination", { length: 10 }).notNull(),
  departureDate: varchar("departureDate", { length: 20 }).notNull(),
  returnDate: varchar("returnDate", { length: 20 }),
  cabinClass: varchar("cabinClass", { length: 50 }).default("ECONOMY"),
  
  // Price data
  lowestPrice: int("lowestPrice").notNull(), // in cents
  averagePrice: int("averagePrice"),
  highestPrice: int("highestPrice"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Airlines with best prices
  cheapestAirline: varchar("cheapestAirline", { length: 10 }),
  availableAirlines: json("availableAirlines"),
  
  // Cache metadata
  resultsCount: int("resultsCount"),
  cachedAt: timestamp("cachedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  hitCount: int("hitCount").default(0),
});

export type FlightPriceCache = typeof flightPriceCache.$inferSelect;
export type InsertFlightPriceCache = typeof flightPriceCache.$inferInsert;

/**
 * Popular destinations for recommendations
 */
export const popularDestinations = mysqlTable("popularDestinations", {
  id: int("id").autoincrement().primaryKey(),
  
  airportCode: varchar("airportCode", { length: 10 }).notNull(),
  cityName: varchar("cityName", { length: 255 }).notNull(),
  countryName: varchar("countryName", { length: 255 }).notNull(),
  countryCode: varchar("countryCode", { length: 10 }),
  
  // Popularity metrics
  searchCount: int("searchCount").default(0),
  bookingCount: int("bookingCount").default(0),
  popularityScore: int("popularityScore").default(0),
  
  // Seasonal info
  bestSeason: varchar("bestSeason", { length: 50 }),
  peakMonths: json("peakMonths"),
  
  // Display info
  imageUrl: varchar("imageUrl", { length: 500 }),
  description: text("description"),
  descriptionPt: text("descriptionPt"),
  descriptionEs: text("descriptionEs"),
  
  // Average prices from cache
  avgPriceUsd: int("avgPriceUsd"),
  
  isActive: boolean("isActive").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PopularDestination = typeof popularDestinations.$inferSelect;
export type InsertPopularDestination = typeof popularDestinations.$inferInsert;

/**
 * User notifications
 */
export const userNotifications = mysqlTable("userNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  type: mysqlEnum("type", ["price_alert", "booking_confirmation", "booking_reminder", "price_drop", "promotion", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Related entities
  relatedBookingId: int("relatedBookingId"),
  relatedAlertId: int("relatedAlertId"),
  relatedRouteOrigin: varchar("relatedRouteOrigin", { length: 10 }),
  relatedRouteDestination: varchar("relatedRouteDestination", { length: 10 }),
  
  // Price info for price alerts
  previousPrice: int("previousPrice"),
  newPrice: int("newPrice"),
  currency: varchar("currency", { length: 3 }),
  
  // Status
  isRead: boolean("isRead").default(false),
  isEmailSent: boolean("isEmailSent").default(false),
  
  // Action URL
  actionUrl: varchar("actionUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;

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
 * Flight searches log for analytics (legacy)
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
  userId: int("userId"),
  messages: json("messages").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

/**
 * Bookings table for completed flight purchases
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Booking reference
  bookingReference: varchar("bookingReference", { length: 20 }),
  
  // Payment identifiers (Square)
  squareOrderId: varchar("squareOrderId", { length: 255 }),
  squarePaymentId: varchar("squarePaymentId", { length: 255 }),
  
  // Legacy Stripe fields
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  
  // Booking status
  status: mysqlEnum("status", ["pending", "paid", "confirmed", "cancelled", "refunded", "completed"]).default("pending").notNull(),
  
  // Flight details
  origin: varchar("origin", { length: 10 }).notNull(),
  originName: varchar("originName", { length: 255 }),
  destination: varchar("destination", { length: 10 }).notNull(),
  destinationName: varchar("destinationName", { length: 255 }),
  departureDate: varchar("departureDate", { length: 20 }).notNull(),
  returnDate: varchar("returnDate", { length: 20 }),
  
  // Passengers
  adults: int("adults").notNull(),
  children: int("children").default(0),
  infants: int("infants").default(0),
  travelClass: varchar("travelClass", { length: 50 }),
  
  // Flight offer details
  flightOffer: json("flightOffer"),
  
  // Pricing
  totalAmount: int("totalAmount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Loyalty points earned
  pointsEarned: int("pointsEarned").default(0),
  
  // Passenger information
  passengerDetails: json("passengerDetails"),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  
  // Special requests
  specialRequests: text("specialRequests"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  paidAt: timestamp("paidAt"),
  completedAt: timestamp("completedAt"),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
