import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./_core/password";
import { getUserByEmail, upsertUser, getDbType } from "./db";
import { sdk } from "./_core/sdk";
// DOGMA 11: Duffel is the canonical flight search API - never use Amadeus
import { searchFlights, searchLocations, getAirlineName, formatDuration, FlightSearchParams } from "./duffel";
import { getDb, getDbType } from "./db";
import { leads as leadsMySQL, flightSearches as flightSearchesMySQL, InsertLead as InsertLeadMySQL, users, orders as ordersMySQL, InsertOrder as InsertOrderMySQL } from "../drizzle/schema";
import { leads as leadsSQLite, flightSearches as flightSearchesSQLite, InsertLead as InsertLeadSQLite, orders as ordersSQLite, InsertOrder as InsertOrderSQLite } from "../drizzle/schema.sqlite";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { processAIRequest, type AIContext } from "./_core/aiAssistant";
import { createPaymentLink, getOrderStatus } from "./square-payment";
import { createOrder as createDuffelOrder, CreateOrderParams } from "./duffel";
import { nanoid } from "nanoid";

// Helper functions to get the correct table based on database type
function getLeadsTable() {
  const dbType = getDbType();
  return dbType === "sqlite" ? leadsSQLite : leadsMySQL;
}

function getFlightSearchesTable() {
  const dbType = getDbType();
  return dbType === "sqlite" ? flightSearchesSQLite : flightSearchesMySQL;
}

function getOrdersTable() {
  const dbType = getDbType();
  return dbType === "sqlite" ? ordersSQLite : ordersMySQL;
}

// Helper to get the correct InsertLead type based on database type
type InsertLead = InsertLeadMySQL | InsertLeadSQLite;
type InsertOrder = InsertOrderMySQL | InsertOrderSQLite;

// CANONICAL ROUTER: Dashboard Router
// DOGMA 3: Validate ALL Inputs with Zod
// DOGMA 2: No Silent Failures - All Errors Are Explicit
const dashboardRouter = router({
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database initialization failed. Please check your DATABASE_URL configuration.",
        });
      }

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required to access dashboard stats.",
        });
      }

      try {
        // Get user info
        const userRecord = await db.select().from(users).where(eq(users.openId, ctx.user.openId)).limit(1);
        const user = userRecord[0] || null;

        // Calculate stats from flightSearches table
        // Note: savedRoutes and priceAlerts tables don't exist yet, so we return 0
        const flightSearchesTable = getFlightSearchesTable();
        const searchStats = await db
          .select({
            totalSearches: sql<number>`COUNT(*)`.as("totalSearches"),
          })
          .from(flightSearchesTable);

        const totalSearches = Number(searchStats[0]?.totalSearches || 0);

        // Get recent searches (last 10)
        const recentSearches = await db
          .select()
          .from(flightSearchesTable)
          .orderBy(desc(flightSearchesTable.searchedAt))
          .limit(10);

        // Get top routes (most searched origin-destination pairs)
        const topRoutesQuery = await db
          .select({
            origin: flightSearchesTable.origin,
            destination: flightSearchesTable.destination,
            count: sql<number>`COUNT(*)`.as("count"),
          })
          .from(flightSearchesTable)
          .groupBy(flightSearchesTable.origin, flightSearchesTable.destination)
          .orderBy(desc(sql`COUNT(*)`))
          .limit(10);

        const topRoutes = topRoutesQuery.map((route) => ({
          id: `${route.origin}-${route.destination}`,
          origin: route.origin || "",
          destination: route.destination || "",
          count: Number(route.count || 0),
        }));

        // Calculate loyalty points (simplified: 1 point per search)
        const loyaltyPoints = totalSearches;
        const loyaltyTier = loyaltyPoints >= 100 ? "platinum" : loyaltyPoints >= 50 ? "gold" : loyaltyPoints >= 20 ? "silver" : "bronze";

        return {
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            loyaltyTier,
            loyaltyPoints,
          } : null,
          stats: {
            totalSearches,
            savedRoutes: 0, // TODO: Implement when savedRoutes table exists
            activeAlerts: 0, // TODO: Implement when priceAlerts table exists
            loyaltyPoints,
          },
          recentSearches: recentSearches.map((search) => ({
            id: search.id,
            origin: search.origin || "",
            originName: search.origin || "", // TODO: Add originName to flightSearches table
            destination: search.destination || "",
            destinationName: search.destination || "", // TODO: Add destinationName to flightSearches table
            departureDate: search.departureDate || "",
            returnDate: search.returnDate || null,
            lowestPrice: search.lowestPrice ? parseFloat(search.lowestPrice) * 100 : null, // Convert to cents
          })),
          topRoutes,
        };
      } catch (error: any) {
        console.error("[Dashboard] Error fetching stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard statistics. Please try again later.",
        });
      }
    }),
});

// CANONICAL ROUTER: Saved Routes Router
// DOGMA 2: Return stable shape even when tables don't exist yet
const savedRoutesRouter = router({
  list: protectedProcedure
    .query(async () => {
      // TODO: Implement when savedRoutes table exists
      // For now, return empty array to maintain contract
      return [];
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Implement when savedRoutes table exists
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Saved routes feature is not yet implemented.",
      });
    }),
});

// CANONICAL ROUTER: Price Alerts Router
// DOGMA 2: Return stable shape even when tables don't exist yet
const priceAlertsRouter = router({
  list: protectedProcedure
    .query(async () => {
      // TODO: Implement when priceAlerts table exists
      // For now, return empty array to maintain contract
      return [];
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Implement when priceAlerts table exists
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Price alerts feature is not yet implemented.",
      });
    }),
});

// CANONICAL ROUTER: Search History Router
// DOGMA 2: Return stable shape using existing flightSearches table
const searchHistoryRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const limit = input?.limit || 20;

      try {
        const flightSearchesTable = getFlightSearchesTable();
        const searches = await db
          .select()
          .from(flightSearchesTable)
          .orderBy(desc(flightSearchesTable.searchedAt))
          .limit(limit);

        return searches.map((search) => ({
          id: search.id,
          origin: search.origin || "",
          destination: search.destination || "",
          departureDate: search.departureDate || "",
          returnDate: search.returnDate || null,
          adults: search.adults || 1,
          children: search.children || 0,
          infants: search.infants || 0,
          travelClass: search.travelClass || "ECONOMY",
          resultsCount: search.resultsCount || 0,
          lowestPrice: search.lowestPrice ? parseFloat(search.lowestPrice) : null,
          searchedAt: search.searchedAt?.toISOString() || new Date().toISOString(),
        }));
      } catch (error: any) {
        console.error("[Search History] Error fetching history:", error);
        return [];
      }
    }),
});

// CANONICAL ROUTER: Checkout Router
const checkoutRouter = router({
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        offerId: z.string().min(1),
        amount: z.number().positive(),
        currency: z.string().length(3).default("USD"),
        customerEmail: z.string().email().trim().min(1, "Email is required"),
        customerName: z.string().optional(),
        flightDetails: z.any(), // Flight offer from Duffel
        passengerCount: z.number().min(1),
        passengers: z.array(
          z.object({
            type: z.enum(["adult", "child", "infant"]),
            given_name: z.string().min(1),
            family_name: z.string().min(1),
            born_on: z.string().optional(),
            gender: z.enum(["m", "f"]).optional(),
            title: z.enum(["mr", "ms", "mrs", "miss"]).optional(),
            email: z.string().email().optional(),
            phone_number: z.string().optional(),
            // Additional fields for customer database
            nationality: z.string().length(2).optional(), // ISO country code
            country_of_residence: z.string().length(2).optional(), // ISO country code
            address: z.object({
              street: z.string().optional(),
              city: z.string().optional(),
              state: z.string().optional(),
              postal_code: z.string().optional(),
              country: z.string().optional(),
            }).optional(),
            emergency_contact: z.object({
              name: z.string().optional(),
              phone: z.string().optional(),
              relationship: z.string().optional(),
            }).optional(),
            special_requests: z.string().optional(), // Dietary, accessibility, etc.
            identity_documents: z
              .array(
                z.object({
                  type: z.enum(["passport", "identity_card", "driving_licence"]),
                  unique_identifier: z.string().optional(),
                  issuing_country_code: z.string().length(2).optional(),
                  expires_on: z.string().optional(),
                })
              )
              .optional(),
          })
        ).optional(), // Store passenger details for later Duffel order creation and customer database
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Generate idempotency key to prevent double charges
      const idempotencyKey = `pi_${input.offerId}_${Date.now()}_${nanoid(8)}`;

      // Check if order already exists with this idempotency key
      const ordersTable = getOrdersTable();
      const existingOrder = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existingOrder.length > 0) {
        // Return existing payment link if order already exists
        if (existingOrder[0].checkoutUrl) {
          return {
            paymentIntentId: existingOrder[0].paymentIntentId || "",
            clientSecret: existingOrder[0].checkoutUrl,
            amount: existingOrder[0].amount,
            currency: existingOrder[0].currency,
            orderId: existingOrder[0].id,
          };
        }
      }

      // Create order record first (pending status)
      const orderData: any = {
        userId: ctx.user.id,
        offerId: input.offerId,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        paymentProvider: "square",
        customerEmail: input.customerEmail,
        customerName: input.customerName || null,
        idempotencyKey,
        flightDetails: getDbType() === "sqlite" 
          ? JSON.stringify(input.flightDetails) 
          : input.flightDetails,
        passengerCount: input.passengerCount,
        passengerDetails: input.passengers 
          ? (getDbType() === "sqlite" 
              ? JSON.stringify(input.passengers) 
              : input.passengers)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let orderId: number;
      try {
        const result = await db.insert(ordersTable).values(orderData);
        orderId = Number(result.insertId || result.lastInsertRowid);
      } catch (error: any) {
        if (error.message?.includes("UNIQUE constraint") || error.message?.includes("Duplicate entry")) {
          // Idempotency key collision - retrieve existing order
          const existing = await db
            .select()
            .from(ordersTable)
            .where(eq(ordersTable.idempotencyKey, idempotencyKey))
            .limit(1);
          
          if (existing.length > 0) {
            orderId = existing[0].id;
            if (existing[0].checkoutUrl) {
              return {
                paymentIntentId: existing[0].paymentIntentId || "",
                clientSecret: existing[0].checkoutUrl,
                amount: existing[0].amount,
                currency: existing[0].currency,
                orderId: existing[0].id,
              };
            }
          } else {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create order",
            });
          }
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create order: ${error.message}`,
          });
        }
      }

      // Create Square Payment Link
      try {
        const paymentLink = await createPaymentLink({
          amount: input.amount,
          currency: input.currency,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          orderId: orderId.toString(),
          idempotencyKey: `square_${idempotencyKey}`,
          offerId: input.offerId,
          origin: input.flightDetails?.origin || "",
          destination: input.flightDetails?.destination || "",
          departureDate: input.flightDetails?.departureDate || "",
          returnDate: input.flightDetails?.returnDate,
          passengers: input.passengerCount,
          travelClass: input.flightDetails?.cabinClass || "ECONOMY",
          redirectUrl: `${ctx.req.headers.origin || "http://localhost:3000"}/checkout/complete?orderId=${orderId}`,
        });

        // Update order with Square order ID and checkout URL
        await db
          .update(ordersTable)
          .set({
            paymentIntentId: paymentLink.orderId, // Store Square order ID
            checkoutUrl: paymentLink.url, // Store payment link URL
            paymentStatus: "pending",
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, orderId));

        return {
          paymentIntentId: paymentLink.orderId,
          clientSecret: paymentLink.url, // Return payment link URL instead of client_secret
          amount: input.amount,
          currency: input.currency,
          orderId,
        };
      } catch (error: any) {
        // Update order with error
        await db
          .update(ordersTable)
          .set({
            status: "failed",
            errorMessage: error.message || "Failed to create payment link",
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, orderId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create payment link: ${error.message}`,
        });
      }
    }),
});

// CANONICAL ROUTER: Orders Router
const ordersRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        orderId: z.number(), // Internal order ID from checkout.createPaymentIntent
        offerId: z.string().min(1),
        paymentIntentId: z.string().min(1),
        passengers: z.array(
          z.object({
            type: z.enum(["adult", "child", "infant"]),
            given_name: z.string().min(1),
            family_name: z.string().min(1),
            born_on: z.string().optional(), // YYYY-MM-DD
            gender: z.enum(["m", "f"]).optional(),
            title: z.enum(["mr", "ms", "mrs", "miss"]).optional(),
            email: z.string().email().optional(),
            phone_number: z.string().optional(),
            // Additional fields for customer database
            nationality: z.string().length(2).optional(), // ISO country code
            country_of_residence: z.string().length(2).optional(), // ISO country code
            address: z.object({
              street: z.string().optional(),
              city: z.string().optional(),
              state: z.string().optional(),
              postal_code: z.string().optional(),
              country: z.string().optional(),
            }).optional(),
            emergency_contact: z.object({
              name: z.string().optional(),
              phone: z.string().optional(),
              relationship: z.string().optional(),
            }).optional(),
            special_requests: z.string().optional(), // Dietary, accessibility, etc.
            identity_documents: z
              .array(
                z.object({
                  type: z.enum(["passport", "identity_card", "driving_licence"]),
                  unique_identifier: z.string().optional(),
                  issuing_country_code: z.string().length(2).optional(),
                  expires_on: z.string().optional(), // YYYY-MM-DD
                })
              )
              .optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify Square order status
      let paymentStatus: string;
      try {
        const orderStatus = await getOrderStatus(input.paymentIntentId); // paymentIntentId is actually Square order ID
        paymentStatus = orderStatus.status;
        
        if (paymentStatus !== "succeeded") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Payment not completed. Status: ${paymentStatus}`,
          });
        }
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to verify payment: ${error.message}`,
        });
      }

      // Get order from database
      const ordersTable = getOrdersTable();
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Order is not in pending status. Current status: ${order.status}`,
        });
      }

      // Update order status to processing
      await db
        .update(ordersTable)
        .set({
          status: "processing",
          paymentStatus: "succeeded",
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, input.orderId));

      // Create Duffel order
      try {
        const duffelOrder = await createDuffelOrder({
          offerId: input.offerId,
          passengers: input.passengers.map((p) => ({
            type: p.type,
            given_name: p.given_name,
            family_name: p.family_name,
            ...(p.born_on && { born_on: p.born_on }),
            ...(p.gender && { gender: p.gender }),
            ...(p.title && { title: p.title }),
            ...(p.email && { email: p.email }),
            ...(p.phone_number && { phone_number: p.phone_number }),
            ...(p.identity_documents && p.identity_documents.length > 0 && {
              identity_documents: p.identity_documents.map((doc) => ({
                type: doc.type,
                ...(doc.unique_identifier && { unique_identifier: doc.unique_identifier }),
                ...(doc.issuing_country_code && { issuing_country_code: doc.issuing_country_code }),
                ...(doc.expires_on && { expires_on: doc.expires_on }),
              })),
            }),
          })),
        });

        // Update order with Duffel order ID and confirm status
        await db
          .update(ordersTable)
          .set({
            duffelOrderId: duffelOrder.id,
            status: "confirmed",
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, input.orderId));

        return {
          success: true,
          orderId: input.orderId,
          duffelOrderId: duffelOrder.id,
          status: "confirmed",
        };
      } catch (error: any) {
        // Update order with error
        await db
          .update(ordersTable)
          .set({
            status: "failed",
            errorMessage: error.message || "Failed to create Duffel order",
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, input.orderId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create flight order: ${error.message}`,
        });
      }
    }),

  // Verify payment and create Duffel order (used by CheckoutComplete page)
  verifyPaymentAndCreate: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentIntentId: z.string().min(1), // Square order ID
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const ordersTable = getOrdersTable();
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // If order already has Duffel order, return success
      if (order.duffelOrderId && order.status === "confirmed") {
        return {
          success: true,
          orderId: order.id,
          duffelOrderId: order.duffelOrderId,
          status: "confirmed",
        };
      }

      // Verify Square payment status
      let paymentStatus: string;
      try {
        const orderStatus = await getOrderStatus(input.paymentIntentId);
        paymentStatus = orderStatus.status;
        
        if (paymentStatus !== "succeeded" && paymentStatus !== "COMPLETED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Payment not completed. Status: ${paymentStatus}`,
          });
        }
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to verify payment: ${error.message}`,
        });
      }

      // Check if we have all required data for Duffel order
      if (!order.offerId || !order.passengerDetails) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order missing required data for ticket issuance. Please contact support.",
        });
      }

      // Parse passenger details
      let passengerDetails: any[];
      try {
        passengerDetails = typeof order.passengerDetails === "string"
          ? JSON.parse(order.passengerDetails)
          : order.passengerDetails;
      } catch (parseError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid passenger details format",
        });
      }

      if (!Array.isArray(passengerDetails) || passengerDetails.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No passenger details found",
        });
      }

      // Update order status to processing
      await db
        .update(ordersTable)
        .set({
          status: "processing",
          paymentStatus: "succeeded",
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, input.orderId));

      // Create Duffel order
      try {
        const duffelOrder = await createDuffelOrder({
          offerId: order.offerId,
          passengers: passengerDetails.map((p: any) => ({
            type: p.type,
            given_name: p.given_name,
            family_name: p.family_name,
            ...(p.born_on && { born_on: p.born_on }),
            ...(p.gender && { gender: p.gender }),
            ...(p.title && { title: p.title }),
            ...(p.email && { email: p.email }),
            ...(p.phone_number && { phone_number: p.phone_number }),
            ...(p.identity_documents && p.identity_documents.length > 0 && {
              identity_documents: p.identity_documents.map((doc: any) => ({
                type: doc.type,
                ...(doc.unique_identifier && { unique_identifier: doc.unique_identifier }),
                ...(doc.issuing_country_code && { issuing_country_code: doc.issuing_country_code }),
                ...(doc.expires_on && { expires_on: doc.expires_on }),
              })),
            }),
          })),
        });

        // Update order with Duffel order ID and confirm status
        await db
          .update(ordersTable)
          .set({
            duffelOrderId: duffelOrder.id,
            status: "confirmed",
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, input.orderId));

        return {
          success: true,
          orderId: input.orderId,
          duffelOrderId: duffelOrder.id,
          status: "confirmed",
        };
      } catch (error: any) {
        // Update order with error
        await db
          .update(ordersTable)
          .set({
            status: "failed",
            errorMessage: error.message || "Failed to create Duffel order",
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, input.orderId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create flight order: ${error.message}`,
        });
      }
    }),

  get: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const ordersTable = getOrdersTable();
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Verify user owns this order
      if (order.customerEmail !== ctx.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return {
        id: order.id,
        offerId: order.offerId,
        duffelOrderId: order.duffelOrderId,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        flightDetails: getDbType() === "sqlite" && typeof order.flightDetails === "string"
          ? JSON.parse(order.flightDetails)
          : order.flightDetails,
        passengerDetails: getDbType() === "sqlite" && typeof order.passengerDetails === "string"
          ? JSON.parse(order.passengerDetails || "null")
          : order.passengerDetails,
      };
    }),

    // Admin: List all orders
    listAll: adminProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const ordersTable = getOrdersTable();
        const allOrders = await db
          .select()
          .from(ordersTable)
          .orderBy(desc(ordersTable.createdAt));

        return allOrders.map((order) => ({
          id: order.id,
          userId: order.userId,
          offerId: order.offerId,
          duffelOrderId: order.duffelOrderId,
          amount: order.amount,
          currency: order.currency,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          status: order.status,
          paymentProvider: order.paymentProvider,
          paymentIntentId: order.paymentIntentId,
          paymentStatus: order.paymentStatus,
          checkoutUrl: order.checkoutUrl,
          passengerCount: order.passengerCount,
          errorMessage: order.errorMessage,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }));
      }),
});

export const appRouter = router({
  system: systemRouter,
  dashboard: dashboardRouter,
  savedRoutes: savedRoutesRouter,
  priceAlerts: priceAlertsRouter,
  searchHistory: searchHistoryRouter,
  checkout: checkoutRouter,
  orders: ordersRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Register with email/password - DOGMA 3: Validate ALL Inputs with Zod
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.string().email("Invalid email address"),
          password: z.string().min(6, "Password must be at least 6 characters"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) {
          // DOGMA 2: No Silent Failures - All Errors Are Explicit
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database initialization failed. Please check your DATABASE_URL configuration and ensure the database file is accessible.",
          });
        }

        // Check if user already exists
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User with this email already exists",
          });
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Generate openId for email/password users (using email as base)
        const openId = `email:${input.email}`;

        // CANONICAL: Detect admin password and set role
        // If password is "admin123", user gets admin role
        const isAdminPassword = input.password === "admin123";
        const userRole = isAdminPassword ? "admin" : "user";

        // Create user
        // DOGMA 10: lastSignedIn must be Date object (Drizzle converts to integer for SQLite)
        await upsertUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "email",
          role: userRole,
          lastSignedIn: new Date(),
        });

        // Get the created user
        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });

        // CANONICAL COOKIE SETTING
        // DOGMA 2: Explicit cookie configuration for session persistence
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
          httpOnly: true, // Explicitly set (prevents XSS)
          path: "/", // Explicitly set (available to all routes)
        });
        
        // DOGMA 2: Structured logging (no secrets) for debugging
        if (process.env.NODE_ENV === 'development') {
          console.debug("[Auth] Registration - Session cookie set:", {
            cookieName: COOKIE_NAME,
            tokenLength: sessionToken.length,
            maxAge: ONE_YEAR_MS,
            sameSite: cookieOptions.sameSite,
            secure: cookieOptions.secure,
            domain: cookieOptions.domain || "not set",
          });
        }

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),
    // Login with email/password - DOGMA 3: Validate ALL Inputs with Zod
    // CANONICAL: Allow "admin" as username for admin login
    login: publicProcedure
      .input(
        z.object({
          email: z.string().min(1, "Email or username is required").refine(
            (val) => {
              // Allow "admin" as special username OR valid email
              return val === "admin" || z.string().email().safeParse(val).success;
            },
            { message: "Please enter a valid email address or 'admin' as username" }
          ),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) {
          // DOGMA 2: No Silent Failures - All Errors Are Explicit
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database initialization failed. Please check your DATABASE_URL configuration and ensure the database file is accessible.",
          });
        }

        // CANONICAL: Handle "admin" as special username
        // If email is "admin", look for a user with email "admin@michelstravel.com" or create admin user on-the-fly
        let user;
        if (input.email === "admin") {
          // Try to find admin user by special email
          user = await getUserByEmail("admin@michelstravel.com");
          
          // If admin user doesn't exist and password is "admin123", create it
          if (!user && input.password === "admin123") {
            const passwordHash = await hashPassword(input.password);
            const openId = `email:admin@michelstravel.com`;
            await upsertUser({
              openId,
              name: "Admin",
              email: "admin@michelstravel.com",
              passwordHash,
              loginMethod: "email",
              role: "admin",
              lastSignedIn: new Date(),
            });
            user = await getUserByEmail("admin@michelstravel.com");
          }
        } else {
          // Regular email lookup
          user = await getUserByEmail(input.email);
        }
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Check if user has password (email/password auth)
        if (!user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "This account uses OAuth login. Please use the OAuth login option.",
          });
        }

        // CANONICAL PASSWORD VERIFICATION
        // DOGMA 2: Explicit validation with consistent error messages
        if (!user.passwordHash) {
          // This should not happen if passwordHash check above passed, but explicit guard
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // CANONICAL: Check for admin password "admin123"
        // If password matches "admin123", grant admin role
        const isAdminPassword = input.password === "admin123";
        let isValid = false;
        
        if (isAdminPassword) {
          // Admin password - verify it matches the stored hash OR update user to admin
          isValid = await verifyPassword(input.password, user.passwordHash);
          
          // If user is not admin but used admin password, upgrade to admin
          if (isValid && user.role !== "admin") {
            await upsertUser({
              openId: user.openId,
              role: "admin",
              lastSignedIn: new Date(),
            });
            // Refresh user to get updated role
            const updatedUser = await getUserByEmail(input.email);
            if (updatedUser) {
              Object.assign(user, updatedUser);
            }
          }
        } else {
          // Regular password verification
          isValid = await verifyPassword(input.password, user.passwordHash);
        }
        
        if (!isValid) {
          // DOGMA 2: Consistent error message (don't reveal which field is wrong)
          // DOGMA 2: Structured logging (no secrets) for debugging
          if (process.env.NODE_ENV === 'development') {
            console.debug("[Auth] Login failed - password verification failed:", {
              userId: user.id,
              email: user.email,
              hasPasswordHash: !!user.passwordHash,
            });
          }
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Update last signed in
        // DOGMA 10: lastSignedIn must be Date object (Drizzle converts to integer for SQLite)
        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        // CANONICAL COOKIE SETTING
        // DOGMA 2: Explicit cookie configuration for session persistence
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
          httpOnly: true, // Explicitly set (prevents XSS)
          path: "/", // Explicitly set (available to all routes)
        });
        
        // DOGMA 2: Structured logging (no secrets) for debugging
        if (process.env.NODE_ENV === 'development') {
          console.debug("[Auth] Login - Session cookie set:", {
            cookieName: COOKIE_NAME,
            tokenLength: sessionToken.length,
            maxAge: ONE_YEAR_MS,
            sameSite: cookieOptions.sameSite,
            secure: cookieOptions.secure,
            domain: cookieOptions.domain || "not set",
            userId: user.id,
          });
        }

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),
  }),

  flights: router({
    searchLocations: publicProcedure
      .input(z.object({ keyword: z.string().min(2) }))
      .query(async ({ input }) => {
        // DOGMA 11: Tratamento explícito de erros de API
        try {
          const results = await searchLocations(input.keyword);
          return results.map(loc => ({
            code: loc.iataCode,
            name: loc.name,
            city: loc.address.cityName,
            country: loc.address.countryName,
            type: loc.subType,
            label: `${loc.name} (${loc.iataCode}) - ${loc.address.cityName}, ${loc.address.countryName}`,
          }));
        } catch (error) {
          // DOGMA 11: Retornar array vazio em caso de erro, não lançar exceção
          // O searchLocations já tem fallback, mas garantimos aqui também
          console.error("[Flight API] Error in searchLocations:", error);
          return [];
        }
      }),

    search: publicProcedure
      .input(z.object({
        origin: z.string().length(3),
        destination: z.string().length(3),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        adults: z.number().min(1).max(9),
        children: z.number().min(0).max(9).default(0),
        infants: z.number().min(0).max(9).default(0),
        travelClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
        nonStop: z.boolean().optional(),
        maxPrice: z.number().optional(),
      }))
      .query(async ({ input }) => {
        // CANONICAL GUARD 1: Validate environment variable at procedure entry
        const duffelApiKey = process.env.DUFFEL_API_KEY;
        if (!duffelApiKey || duffelApiKey.trim() === "") {
          // DOGMA 2: No silent failures - explicit error with actionable message
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Flight search service is not configured. Please set DUFFEL_API_KEY in your .env file.",
          });
        }

        // CANONICAL GUARD 2: Validate input date format (basic validation)
        const departureDateObj = new Date(input.departureDate);
        if (isNaN(departureDateObj.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid departure date format. Please use YYYY-MM-DD format.",
          });
        }

        // DOGMA 11: Duffel API - map parameters correctly
        const params: FlightSearchParams = {
          origin: input.origin,
          destination: input.destination,
          departureDate: input.departureDate,
          returnDate: input.returnDate,
          adults: input.adults,
          children: input.children,
          infants: input.infants,
          cabinClass: input.travelClass?.toLowerCase() as "economy" | "premium_economy" | "business" | "first" || "economy",
          maxPrice: input.maxPrice,
        };

        try {
          // CANONICAL GUARD 3: Wrap external API call with proper error categorization
          const response = await searchFlights(params);
          
          // CANONICAL GUARD 4: Validate response shape before processing
          if (!response || typeof response !== "object") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Invalid response from flight search service. Please try again later.",
            });
          }

          // Validate data array exists and is an array
          if (!Array.isArray(response.data)) {
            // DOGMA 2: Log structured diagnostics (no secrets)
            console.error("[Flight Search] Invalid response shape:", {
              hasData: !!response.data,
              dataType: typeof response.data,
              responseKeys: response ? Object.keys(response) : [],
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Flight search service returned invalid data format. Please try again later.",
            });
          }

          // Log search to database (non-blocking, failures don't affect response)
          const db = await getDb();
          if (db) {
            try {
              const flightSearchesTable = getFlightSearchesTable();
              await db.insert(flightSearchesTable).values({
                origin: input.origin,
                destination: input.destination,
                departureDate: input.departureDate,
                returnDate: input.returnDate || null,
                adults: input.adults,
                children: input.children || null,
                infants: input.infants || null,
                travelClass: input.travelClass || null,
                resultsCount: response.data.length,
                lowestPrice: response.data[0]?.total_amount ? String(parseFloat(response.data[0].total_amount)) : null,
              });
            } catch (dbError) {
              // DOGMA 2: Log but don't fail the request
              console.error("[Flight Search] Failed to log search to database:", {
                error: dbError instanceof Error ? dbError.message : String(dbError),
                origin: input.origin,
                destination: input.destination,
              });
            }
          }

          // CANONICAL GUARD 5: Safe mapping with null checks
          const flights = response.data.map((offer) => {
            // Validate offer structure
            if (!offer || !offer.slices || !Array.isArray(offer.slices) || offer.slices.length === 0) {
              // DOGMA 2: Log malformed offer but continue processing others
              console.warn("[Flight Search] Skipping malformed offer:", {
                offerId: offer?.id,
                hasSlices: !!offer?.slices,
                slicesType: typeof offer?.slices,
              });
              return null;
            }

            const outbound = offer.slices[0];
            const inbound = offer.slices[1];

            // Validate outbound slice structure
            if (!outbound || !outbound.origin || !outbound.destination || !Array.isArray(outbound.segments)) {
              console.warn("[Flight Search] Skipping offer with invalid outbound slice:", {
                offerId: offer.id,
              });
              return null;
            }

            return {
              id: offer.id || `offer-${Math.random().toString(36).substr(2, 9)}`,
              price: {
                total: offer.total_amount || "0",
                currency: offer.total_currency || "USD",
                base: offer.total_amount || "0",
              },
              outbound: {
                departure: {
                  iataCode: outbound.origin.iata_code || "",
                  at: outbound.segments[0]?.departing_at || "",
                },
                arrival: {
                  iataCode: outbound.destination.iata_code || "",
                  at: outbound.segments[outbound.segments.length - 1]?.arriving_at || "",
                },
                duration: outbound.duration || "",
                stops: Math.max(0, (outbound.segments?.length || 1) - 1),
                segments: (outbound.segments || []).map((seg: any) => ({
                  departure: {
                    iataCode: seg.origin?.iata_code || "",
                    at: seg.departing_at || "",
                  },
                  arrival: {
                    iataCode: seg.destination?.iata_code || "",
                    at: seg.arriving_at || "",
                  },
                  carrier: seg.marketing_carrier?.name || "",
                  carrierCode: seg.marketing_carrier?.iata_code || "",
                  flightNumber: seg.marketing_carrier_flight_number || "",
                  duration: seg.duration || "",
                  aircraft: seg.aircraft?.name || seg.aircraft?.id || "",
                })),
              },
              inbound: inbound && Array.isArray(inbound.segments) ? {
                departure: {
                  iataCode: inbound.origin?.iata_code || "",
                  at: inbound.segments[0]?.departing_at || "",
                },
                arrival: {
                  iataCode: inbound.destination?.iata_code || "",
                  at: inbound.segments[inbound.segments.length - 1]?.arriving_at || "",
                },
                duration: inbound.duration || "",
                stops: Math.max(0, (inbound.segments?.length || 1) - 1),
                segments: (inbound.segments || []).map((seg: any) => ({
                  departure: {
                    iataCode: seg.origin?.iata_code || "",
                    at: seg.departing_at || "",
                  },
                  arrival: {
                    iataCode: seg.destination?.iata_code || "",
                    at: seg.arriving_at || "",
                  },
                  carrier: seg.marketing_carrier?.name || "",
                  carrierCode: seg.marketing_carrier?.iata_code || "",
                  flightNumber: seg.marketing_carrier_flight_number || "",
                  duration: seg.duration || "",
                  aircraft: seg.aircraft?.name || seg.aircraft?.id || "",
                })),
              } : null,
              cabinClass: params.cabinClass?.toUpperCase() || "ECONOMY",
              baggage: undefined,
              validatingAirline: offer.owner?.name || "",
              validatingAirlineCode: offer.owner?.iata_code || "",
              seatsAvailable: undefined,
              lastTicketingDate: undefined,
            };
          }).filter((flight): flight is NonNullable<typeof flight> => flight !== null);

          return {
            flights,
            meta: {
              totalResults: flights.length,
              carriers: {},
            },
          };
        } catch (error: any) {
          // CANONICAL ERROR HANDLING: Categorize errors by root cause
          
          // DOGMA 2: Structured logging with safe diagnostics (no secrets)
          const errorDetails = {
            errorType: error.constructor?.name || "Unknown",
            message: error.message || "Unknown error",
            statusCode: error.response?.status || error.statusCode,
            hasResponse: !!error.response,
            responseKeys: error.response?.data ? Object.keys(error.response.data) : [],
          };
          
          console.error("[Flight Search] Error occurred:", errorDetails);

          // Categorize error by HTTP status code or error type
          if (error.response?.status === 401 || error.response?.status === 403) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Flight search service authentication failed. Please check DUFFEL_API_KEY configuration.",
            });
          }

          if (error.response?.status === 429) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Flight search service rate limit exceeded. Please try again in a moment.",
            });
          }

          if (error.response?.status === 400 || error.response?.status === 422) {
            const errorDetail = error.response?.data?.errors?.[0]?.message || 
                              error.response?.data?.errors?.[0]?.detail ||
                              error.response?.data?.title ||
                              "Invalid search parameters";
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: errorDetail,
            });
          }

          // Check for missing configuration errors
          if (error.message?.includes("not configured") || 
              error.message?.includes("DUFFEL_API_KEY") ||
              error.message?.includes("credentials")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Flight search service is not configured. Please set DUFFEL_API_KEY in your .env file.",
            });
          }

          // Network/timeout errors
          if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Unable to connect to flight search service. Please try again later.",
            });
          }

          // Generic fallback - should rarely happen with proper categorization above
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to search flights at this time. Please try again later.",
          });
        }
      }),
  }),

  leads: router({
    create: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        type: z.enum(["booking", "quote", "contact"]),
        origin: z.string().optional(),
        originName: z.string().optional(),
        destination: z.string().optional(),
        destinationName: z.string().optional(),
        departureDate: z.string().optional(),
        returnDate: z.string().optional(),
        adults: z.number().optional(),
        children: z.number().optional(),
        infants: z.number().optional(),
        travelClass: z.string().optional(),
        flightDetails: z.any().optional(),
        estimatedPrice: z.string().optional(),
        message: z.string().optional(),
        preferredLanguage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          // DOGMA 10: Database Auto-Initialization - This should never happen
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database initialization failed. Please check your DATABASE_URL configuration.",
          });
        }

        const leadsTable = getLeadsTable();
        const dbType = getDbType();

        // Prepare lead data - handle JSON serialization for SQLite
        const leadData: any = {
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          type: input.type,
          origin: input.origin || null,
          originName: input.originName || null,
          destination: input.destination || null,
          destinationName: input.destinationName || null,
          departureDate: input.departureDate || null,
          returnDate: input.returnDate || null,
          adults: input.adults || null,
          children: input.children || null,
          infants: input.infants || null,
          travelClass: input.travelClass || null,
          estimatedPrice: input.estimatedPrice || null,
          message: input.message || null,
          preferredLanguage: input.preferredLanguage || "en",
        };

        // SQLite stores JSON as TEXT, MySQL has native JSON type
        if (dbType === "sqlite") {
          leadData.flightDetails = input.flightDetails ? JSON.stringify(input.flightDetails) : null;
        } else {
          leadData.flightDetails = input.flightDetails || null;
        }

        // CANONICAL: Persist lead to database first (critical operation)
        try {
          await db.insert(leadsTable).values(leadData);
        } catch (error: any) {
          // DOGMA 2: No silent failures - provide meaningful error messages
          const errorMessage = error.message || "Failed to create lead";
          console.error("[Leads] Failed to insert lead:", errorMessage);
          
          // Check for specific SQLite errors
          if (errorMessage.includes("no such table")) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database schema not initialized. Please restart the server to initialize the database.",
            });
          }
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to submit request: ${errorMessage}`,
          });
        }

        // CANONICAL: Attempt notification as best-effort (non-blocking)
        // Lead is already saved, so notification failure should not affect response
        let notificationStatus: "sent" | "failed" | "skipped" = "skipped";
        try {
          const typeLabels = {
            booking: "New Booking Request",
            quote: "New Quote Request",
            contact: "New Contact Message",
          };

          const flightInfo = input.origin && input.destination
            ? `\n\nFlight: ${input.originName || input.origin} → ${input.destinationName || input.destination}\nDate: ${input.departureDate}${input.returnDate ? ` - ${input.returnDate}` : ""}\nPassengers: ${input.adults || 1} adult(s)${input.children ? `, ${input.children} child(ren)` : ""}${input.infants ? `, ${input.infants} infant(s)` : ""}\nClass: ${input.travelClass || "Economy"}${input.estimatedPrice ? `\nEstimated Price: $${input.estimatedPrice}` : ""}`
            : "";

          const notificationSent = await notifyOwner({
            title: `${typeLabels[input.type]} - Michel's Travel`,
            content: `Name: ${input.name}\nEmail: ${input.email}${input.phone ? `\nPhone: ${input.phone}` : ""}${flightInfo}${input.message ? `\n\nMessage: ${input.message}` : ""}`,
          });

          notificationStatus = notificationSent ? "sent" : "failed";
          
          if (!notificationSent) {
            // Log but don't throw - lead is already saved
            console.warn("[Leads] Lead saved successfully, but notification failed or was skipped");
          }
        } catch (notificationError: any) {
          // DOGMA 2: Log notification errors but never fail lead creation
          console.error("[Leads] Notification error (lead was saved):", {
            error: notificationError.message || String(notificationError),
            leadEmail: input.email,
          });
          notificationStatus = "failed";
        }

        // CANONICAL: Return stable response with notification status
        return { 
          success: true,
          notificationStatus, // "sent" | "failed" | "skipped"
        };
      }),

    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      
      const leadsTable = getLeadsTable();
      const results = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt)).limit(100);
      
      // Parse JSON fields for SQLite
      const dbType = getDbType();
      if (dbType === "sqlite") {
        return results.map(lead => ({
          ...lead,
          flightDetails: lead.flightDetails ? JSON.parse(lead.flightDetails as string) : null,
        }));
      }
      
      return results;
    }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "converted", "closed"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database initialization failed. Please check your DATABASE_URL configuration.",
          });
        }
        
        const leadsTable = getLeadsTable();
        
        try {
          await db.update(leadsTable).set({ status: input.status }).where(eq(leadsTable.id, input.id));
          return { success: true };
        } catch (error: any) {
          console.error("[Leads] Failed to update lead status:", error.message);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update lead status: ${error.message}`,
          });
        }
      }),
  }),

  chat: router({
    sendMessage: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        message: z.string(),
        language: z.enum(["en", "pt", "es"]).default("en"),
        userAge: z.number().optional(),
        agentMode: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const { getSessionContext, updateSessionContext, addMessageToHistory } = await import("./_core/sessionStore");
        
        // Get or create session context
        const context = getSessionContext(input.sessionId, input.language);
        
        // Update user age if provided
        if (input.userAge) {
          updateSessionContext(input.sessionId, {
            userAge: input.userAge,
            isElderly: input.userAge >= 60,
          });
        }

        // Add user message to history
        addMessageToHistory(input.sessionId, "user", input.message);

        try {
          // Process with advanced AI assistant
          const aiResponse = await processAIRequest(input.message, context);

          // Add assistant response to history
          addMessageToHistory(input.sessionId, "assistant", aiResponse.message);

          return {
            response: aiResponse.message,
            sessionId: input.sessionId,
            flightResults: aiResponse.flightResults,
            actions: aiResponse.actions,
            needsUserInput: aiResponse.needsUserInput,
            userAge: context.userAge,
            isElderly: context.isElderly,
          };
        } catch (error: any) {
          // Log error for debugging
          console.error("Chat error:", error);
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            sessionId: input.sessionId,
          });

          // Fallback to simple response on error
          const errorMessage = input.language === "pt" 
            ? "Desculpe, ocorreu um erro. Por favor, tente novamente."
            : input.language === "es"
            ? "Lo siento, ocurrió un error. Por favor, inténtelo de nuevo."
            : "I apologize, an error occurred. Please try again.";

          return {
            response: errorMessage,
            sessionId: input.sessionId,
          };
        }
      }),

    // Get session context (for frontend to check user age, etc.)
    getSession: publicProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        const { getSessionContext } = await import("./_core/sessionStore");
        const context = getSessionContext(input.sessionId);
        return {
          userAge: context.userAge,
          isElderly: context.isElderly,
          language: context.language,
        };
      }),

    // Update user age
    updateUserAge: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        age: z.number().min(0).max(150),
      }))
      .mutation(async ({ input }) => {
        const { updateSessionContext } = await import("./_core/sessionStore");
        updateSessionContext(input.sessionId, {
          userAge: input.age,
          isElderly: input.age >= 60,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
