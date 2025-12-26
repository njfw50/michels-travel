import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  users, 
  travelerProfiles, 
  frequentFlyerPrograms, 
  userPreferences,
  savedRoutes,
  priceAlerts,
  userSearchHistory,
  userNotifications,
  InsertTravelerProfile,
  InsertFrequentFlyerProgram,
  InsertUserPreference,
  InsertSavedRoute,
  InsertPriceAlert,
  InsertUserSearchHistory,
} from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ============ User Profile Router ============
export const userProfileRouter = router({
  // Get current user's full profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user[0]) throw new Error("User not found");

    const travelers = await db.select().from(travelerProfiles)
      .where(eq(travelerProfiles.userId, ctx.user.id))
      .orderBy(desc(travelerProfiles.isPrimary));

    const ffPrograms = await db.select().from(frequentFlyerPrograms)
      .where(eq(frequentFlyerPrograms.userId, ctx.user.id));

    const preferences = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, ctx.user.id))
      .limit(1);

    return {
      user: user[0],
      travelers,
      frequentFlyerPrograms: ffPrograms,
      preferences: preferences[0] || null,
    };
  }),

  // Update user basic info
  updateBasicInfo: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      preferredLanguage: z.enum(["en", "pt", "es"]).optional(),
      preferredCurrency: z.string().optional(),
      emailNotifications: z.boolean().optional(),
      priceAlertNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users).set(input).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});

// ============ Traveler Profiles Router ============
export const travelerProfilesRouter = router({
  // List all traveler profiles for user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(travelerProfiles)
      .where(eq(travelerProfiles.userId, ctx.user.id))
      .orderBy(desc(travelerProfiles.isPrimary));
  }),

  // Get single traveler profile
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const profile = await db.select().from(travelerProfiles)
        .where(and(
          eq(travelerProfiles.id, input.id),
          eq(travelerProfiles.userId, ctx.user.id)
        ))
        .limit(1);

      return profile[0] || null;
    }),

  // Create new traveler profile
  create: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      middleName: z.string().optional(),
      dateOfBirth: z.string(),
      gender: z.enum(["male", "female", "other"]).optional(),
      nationality: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      documentType: z.enum(["passport", "id_card", "drivers_license"]).optional(),
      documentNumber: z.string().optional(),
      documentCountry: z.string().optional(),
      documentExpiry: z.string().optional(),
      seatPreference: z.enum(["window", "aisle", "middle", "no_preference"]).optional(),
      mealPreference: z.enum(["regular", "vegetarian", "vegan", "halal", "kosher", "gluten_free", "no_preference"]).optional(),
      specialAssistance: z.string().optional(),
      relationship: z.enum(["self", "spouse", "child", "parent", "sibling", "friend", "colleague", "other"]).optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // If setting as primary, unset other primaries first
      if (input.isPrimary) {
        await db.update(travelerProfiles)
          .set({ isPrimary: false })
          .where(eq(travelerProfiles.userId, ctx.user.id));
      }

      const profileData: InsertTravelerProfile = {
        userId: ctx.user.id,
        ...input,
      };

      const result = await db.insert(travelerProfiles).values(profileData);
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Update traveler profile
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      middleName: z.string().optional(),
      dateOfBirth: z.string().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      nationality: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      documentType: z.enum(["passport", "id_card", "drivers_license"]).optional(),
      documentNumber: z.string().optional(),
      documentCountry: z.string().optional(),
      documentExpiry: z.string().optional(),
      seatPreference: z.enum(["window", "aisle", "middle", "no_preference"]).optional(),
      mealPreference: z.enum(["regular", "vegetarian", "vegan", "halal", "kosher", "gluten_free", "no_preference"]).optional(),
      specialAssistance: z.string().optional(),
      relationship: z.enum(["self", "spouse", "child", "parent", "sibling", "friend", "colleague", "other"]).optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // If setting as primary, unset other primaries first
      if (updateData.isPrimary) {
        await db.update(travelerProfiles)
          .set({ isPrimary: false })
          .where(eq(travelerProfiles.userId, ctx.user.id));
      }

      await db.update(travelerProfiles)
        .set(updateData)
        .where(and(
          eq(travelerProfiles.id, id),
          eq(travelerProfiles.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  // Delete traveler profile
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(travelerProfiles)
        .where(and(
          eq(travelerProfiles.id, input.id),
          eq(travelerProfiles.userId, ctx.user.id)
        ));

      return { success: true };
    }),
});

// ============ Frequent Flyer Programs Router ============
export const frequentFlyerRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(frequentFlyerPrograms)
      .where(eq(frequentFlyerPrograms.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(z.object({
      airlineCode: z.string().min(2).max(3),
      airlineName: z.string(),
      memberNumber: z.string(),
      tierStatus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const data: InsertFrequentFlyerProgram = {
        userId: ctx.user.id,
        ...input,
      };

      await db.insert(frequentFlyerPrograms).values(data);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      memberNumber: z.string().optional(),
      tierStatus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      await db.update(frequentFlyerPrograms)
        .set(updateData)
        .where(and(
          eq(frequentFlyerPrograms.id, id),
          eq(frequentFlyerPrograms.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(frequentFlyerPrograms)
        .where(and(
          eq(frequentFlyerPrograms.id, input.id),
          eq(frequentFlyerPrograms.userId, ctx.user.id)
        ));

      return { success: true };
    }),
});

// ============ User Preferences Router ============
export const preferencesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const prefs = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, ctx.user.id))
      .limit(1);

    return prefs[0] || null;
  }),

  upsert: protectedProcedure
    .input(z.object({
      preferredAirlines: z.array(z.string()).optional(),
      avoidedAirlines: z.array(z.string()).optional(),
      preferredCabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
      maxStops: z.number().min(0).max(3).optional(),
      preferredDepartureTime: z.enum(["early_morning", "morning", "afternoon", "evening", "night", "any"]).optional(),
      homeAirports: z.array(z.string()).optional(),
      preferredAlliances: z.array(z.string()).optional(),
      budgetRange: z.enum(["budget", "moderate", "premium", "luxury"]).optional(),
      priceDropThreshold: z.number().min(1).max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(userPreferences)
        .where(eq(userPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing[0]) {
        await db.update(userPreferences)
          .set(input)
          .where(eq(userPreferences.userId, ctx.user.id));
      } else {
        const data: InsertUserPreference = {
          userId: ctx.user.id,
          ...input,
        };
        await db.insert(userPreferences).values(data);
      }

      return { success: true };
    }),
});

// ============ Saved Routes Router ============
export const savedRoutesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(savedRoutes)
      .where(eq(savedRoutes.userId, ctx.user.id))
      .orderBy(desc(savedRoutes.searchCount));
  }),

  create: protectedProcedure
    .input(z.object({
      origin: z.string().length(3),
      originName: z.string(),
      destination: z.string().length(3),
      destinationName: z.string(),
      preferredCabinClass: z.string().optional(),
      typicalTravelers: z.number().optional(),
      nickname: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if route already exists
      const existing = await db.select().from(savedRoutes)
        .where(and(
          eq(savedRoutes.userId, ctx.user.id),
          eq(savedRoutes.origin, input.origin),
          eq(savedRoutes.destination, input.destination)
        ))
        .limit(1);

      if (existing[0]) {
        // Update search count
        await db.update(savedRoutes)
          .set({ 
            searchCount: sql`${savedRoutes.searchCount} + 1`,
            lastSearched: new Date(),
          })
          .where(eq(savedRoutes.id, existing[0].id));
        return { success: true, id: existing[0].id, existed: true };
      }

      const data: InsertSavedRoute = {
        userId: ctx.user.id,
        ...input,
        searchCount: 1,
        lastSearched: new Date(),
      };

      const result = await db.insert(savedRoutes).values(data);
      return { success: true, id: Number(result[0].insertId), existed: false };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(savedRoutes)
        .where(and(
          eq(savedRoutes.id, input.id),
          eq(savedRoutes.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  incrementSearch: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(savedRoutes)
        .set({ 
          searchCount: sql`${savedRoutes.searchCount} + 1`,
          lastSearched: new Date(),
        })
        .where(and(
          eq(savedRoutes.id, input.id),
          eq(savedRoutes.userId, ctx.user.id)
        ));

      return { success: true };
    }),
});

// ============ Price Alerts Router ============
export const priceAlertsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(priceAlerts)
      .where(eq(priceAlerts.userId, ctx.user.id))
      .orderBy(desc(priceAlerts.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      origin: z.string().length(3),
      originName: z.string(),
      destination: z.string().length(3),
      destinationName: z.string(),
      departureDateStart: z.string().optional(),
      departureDateEnd: z.string().optional(),
      returnDateStart: z.string().optional(),
      returnDateEnd: z.string().optional(),
      isFlexibleDates: z.boolean().optional(),
      adults: z.number().optional(),
      children: z.number().optional(),
      infants: z.number().optional(),
      cabinClass: z.string().optional(),
      targetPrice: z.number(), // in cents
      currency: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Set expiry to 90 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const data: InsertPriceAlert = {
        userId: ctx.user.id,
        ...input,
        isActive: true,
        expiresAt,
      };

      const result = await db.insert(priceAlerts).values(data);
      return { success: true, id: Number(result[0].insertId) };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      targetPrice: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      await db.update(priceAlerts)
        .set(updateData)
        .where(and(
          eq(priceAlerts.id, id),
          eq(priceAlerts.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(priceAlerts)
        .where(and(
          eq(priceAlerts.id, input.id),
          eq(priceAlerts.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current status
      const current = await db.select().from(priceAlerts)
        .where(and(
          eq(priceAlerts.id, input.id),
          eq(priceAlerts.userId, ctx.user.id)
        ))
        .limit(1);

      if (!current[0]) throw new Error("Alert not found");

      await db.update(priceAlerts)
        .set({ isActive: !current[0].isActive })
        .where(and(
          eq(priceAlerts.id, input.id),
          eq(priceAlerts.userId, ctx.user.id)
        ));

      return { success: true };
    }),
});

// ============ Search History Router ============
export const searchHistoryRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select().from(userSearchHistory)
        .where(eq(userSearchHistory.userId, ctx.user.id))
        .orderBy(desc(userSearchHistory.searchedAt))
        .limit(input.limit || 20);
    }),

  record: protectedProcedure
    .input(z.object({
      origin: z.string().length(3),
      originName: z.string(),
      destination: z.string().length(3),
      destinationName: z.string(),
      departureDate: z.string(),
      returnDate: z.string().optional(),
      adults: z.number().optional(),
      children: z.number().optional(),
      infants: z.number().optional(),
      cabinClass: z.string().optional(),
      resultsCount: z.number().optional(),
      lowestPrice: z.number().optional(),
      averagePrice: z.number().optional(),
      currency: z.string().optional(),
      filtersApplied: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const data: InsertUserSearchHistory = {
        userId: ctx.user.id,
        ...input,
      };

      await db.insert(userSearchHistory).values(data);
      return { success: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(userSearchHistory)
      .where(eq(userSearchHistory.userId, ctx.user.id));

    return { success: true };
  }),
});

// ============ Notifications Router ============
export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ 
      unreadOnly: z.boolean().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(userNotifications)
        .where(eq(userNotifications.userId, ctx.user.id));

      if (input.unreadOnly) {
        query = db.select().from(userNotifications)
          .where(and(
            eq(userNotifications.userId, ctx.user.id),
            eq(userNotifications.isRead, false)
          ));
      }

      return query.orderBy(desc(userNotifications.createdAt)).limit(input.limit || 50);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return 0;

    const result = await db.select({ count: sql<number>`count(*)` })
      .from(userNotifications)
      .where(and(
        eq(userNotifications.userId, ctx.user.id),
        eq(userNotifications.isRead, false)
      ));

    return result[0]?.count || 0;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(userNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(userNotifications.id, input.id),
          eq(userNotifications.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.update(userNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(userNotifications.userId, ctx.user.id),
        eq(userNotifications.isRead, false)
      ));

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(userNotifications)
        .where(and(
          eq(userNotifications.id, input.id),
          eq(userNotifications.userId, ctx.user.id)
        ));

      return { success: true };
    }),
});

// ============ Dashboard Analytics Router ============
export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // Get user info with loyalty
    const user = await db.select().from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    // Count total bookings
    const bookingsResult = await db.select({ count: sql<number>`count(*)` })
      .from(userSearchHistory)
      .where(eq(userSearchHistory.userId, ctx.user.id));

    // Count saved routes
    const routesResult = await db.select({ count: sql<number>`count(*)` })
      .from(savedRoutes)
      .where(eq(savedRoutes.userId, ctx.user.id));

    // Count active price alerts
    const alertsResult = await db.select({ count: sql<number>`count(*)` })
      .from(priceAlerts)
      .where(and(
        eq(priceAlerts.userId, ctx.user.id),
        eq(priceAlerts.isActive, true)
      ));

    // Get recent searches
    const recentSearches = await db.select().from(userSearchHistory)
      .where(eq(userSearchHistory.userId, ctx.user.id))
      .orderBy(desc(userSearchHistory.searchedAt))
      .limit(5);

    // Get top routes
    const topRoutes = await db.select().from(savedRoutes)
      .where(eq(savedRoutes.userId, ctx.user.id))
      .orderBy(desc(savedRoutes.searchCount))
      .limit(5);

    return {
      user: user[0],
      stats: {
        totalSearches: bookingsResult[0]?.count || 0,
        savedRoutes: routesResult[0]?.count || 0,
        activeAlerts: alertsResult[0]?.count || 0,
        loyaltyPoints: user[0]?.loyaltyPoints || 0,
        loyaltyTier: user[0]?.loyaltyTier || "bronze",
      },
      recentSearches,
      topRoutes,
    };
  }),
});
