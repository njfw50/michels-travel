import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./_core/password";
import { getUserByEmail, upsertUser } from "./db";
import { sdk } from "./_core/sdk";
import { searchFlights, searchLocations as searchAmadeusLocations, getAirlineName, formatDuration, FlightSearchParams } from "./amadeus";
import { searchLocalAirports, getAirportByCode } from "./airports";
import { getDb } from "./db";
import { leads, flightSearches, bookings, users, InsertLead, InsertBooking } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { createSquareAdapter } from "./providers/square/adapter";
import { checkoutDomain } from "./domains/checkout/domain";
import { AppError, ErrorCode, createCanonicalError, DatabaseError } from "./_core/canonicalErrors";
import {
  AuthMeOutputSchema,
  AuthLogoutOutputSchema,
  LocationSearchOutputSchema,
  FlightSearchOutputSchema,
  LeadCreationOutputSchema,
  LeadListOutputSchema,
  LeadStatusUpdateOutputSchema,
  BookingCreationOutputSchema,
  BookingOutputSchema,
  BookingListOutputSchema,
  PaymentVerificationOutputSchema,
  ChatMessageOutputSchema,
} from "./_core/outputSchemas";
import {
  userProfileRouter,
  travelerProfilesRouter,
  frequentFlyerRouter,
  preferencesRouter,
  savedRoutesRouter,
  priceAlertsRouter,
  searchHistoryRouter,
  notificationsRouter,
  dashboardRouter,
} from "./userRouters";

export const appRouter = router({
  system: systemRouter,
  
  // User management routers
  userProfile: userProfileRouter,
  travelers: travelerProfilesRouter,
  frequentFlyer: frequentFlyerRouter,
  preferences: preferencesRouter,
  savedRoutes: savedRoutesRouter,
  priceAlerts: priceAlertsRouter,
  searchHistory: searchHistoryRouter,
  notifications: notificationsRouter,
  dashboard: dashboardRouter,
  
  auth: router({
    // P0.5: Output schema added
    me: publicProcedure
      .output(AuthMeOutputSchema)
      .query(opts => opts.ctx.user),
    // P0.5: Output schema added
    logout: publicProcedure
      .output(AuthLogoutOutputSchema)
      .mutation(({ ctx }) => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
      }),
    // Register with email/password
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
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available. Please configure DATABASE_URL in .env file and run 'pnpm db:init'",
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

        // Create user
        await upsertUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "email",
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

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

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
    // Login with email/password
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Invalid email address"),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available. Please configure DATABASE_URL in .env file and run 'pnpm db:init'",
          });
        }

        // Get user by email
        const user = await getUserByEmail(input.email);
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

        // Verify password
        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Update last signed in
        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

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
    // P0.5: Output schema added
    searchLocations: publicProcedure
      .input(z.object({ keyword: z.string().min(2) }))
      .output(LocationSearchOutputSchema)
      .query(async ({ input }) => {
        // First, search local database (comprehensive worldwide coverage)
        const localResults = searchLocalAirports(input.keyword);
        
        // Map local results to the expected format
        const mappedLocal = localResults.map(loc => ({
          code: loc.code,
          name: loc.name,
          city: loc.city,
          country: loc.country,
          type: "AIRPORT" as "AIRPORT" | "CITY",
          label: `${loc.name} (${loc.code}) - ${loc.city}, ${loc.country}`,
        }));
        
        // If we have good local results, return them
        if (mappedLocal.length >= 3) {
          return mappedLocal;
        }
        
        // Otherwise, also try Amadeus API and merge results
        try {
          const amadeusResults = await searchAmadeusLocations(input.keyword);
          const mappedAmadeus = amadeusResults.map(loc => ({
            code: loc.iataCode,
            name: loc.name,
            city: loc.address.cityName,
            country: loc.address.countryName,
            type: loc.subType as "AIRPORT" | "CITY",
            label: `${loc.name} (${loc.iataCode}) - ${loc.address.cityName}, ${loc.address.countryName}`,
          }));
          
          // Merge results, removing duplicates by code
          const seenCodes = new Set(mappedLocal.map(r => r.code));
          const merged = [...mappedLocal];
          
          for (const result of mappedAmadeus) {
            if (!seenCodes.has(result.code)) {
              merged.push(result);
              seenCodes.add(result.code);
            }
          }
          
          return merged.slice(0, 15);
        } catch (error) {
          // If Amadeus fails, return local results
          return mappedLocal;
        }
      }),

    // P0.5: Output schema added
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
      .output(FlightSearchOutputSchema)
      .query(async ({ input }) => {
        const params: FlightSearchParams = {
          originLocationCode: input.origin,
          destinationLocationCode: input.destination,
          departureDate: input.departureDate,
          adults: input.adults,
          children: input.children,
          infants: input.infants,
          travelClass: input.travelClass,
          nonStop: input.nonStop,
          maxPrice: input.maxPrice,
          returnDate: input.returnDate,
          currencyCode: "USD",
          max: 50,
        };

        const response = await searchFlights(params);
        
        const db = await getDb();
        if (db) {
          try {
            await db.insert(flightSearches).values({
              origin: input.origin,
              destination: input.destination,
              departureDate: input.departureDate,
              returnDate: input.returnDate,
              adults: input.adults,
              children: input.children,
              infants: input.infants,
              travelClass: input.travelClass,
              resultsCount: response.data?.length || 0,
              lowestPrice: response.data?.[0]?.price?.grandTotal,
            });
          } catch (e) {
            console.error("Failed to log search:", e);
          }
        }

        const carriers = response.dictionaries?.carriers || {};
        
        return {
          flights: response.data.map(offer => {
            const outbound = offer.itineraries[0];
            const inbound = offer.itineraries[1];
            
            return {
              id: offer.id,
              price: {
                total: offer.price.grandTotal,
                currency: offer.price.currency,
                base: offer.price.base,
              },
              outbound: {
                departure: outbound.segments[0].departure,
                arrival: outbound.segments[outbound.segments.length - 1].arrival,
                duration: formatDuration(outbound.duration),
                stops: outbound.segments.length - 1,
                segments: outbound.segments.map(seg => ({
                  departure: seg.departure,
                  arrival: seg.arrival,
                  carrier: carriers[seg.carrierCode] || getAirlineName(seg.carrierCode),
                  carrierCode: seg.carrierCode,
                  flightNumber: `${seg.carrierCode}${seg.number}`,
                  duration: formatDuration(seg.duration),
                  aircraft: seg.aircraft.code,
                })),
              },
              inbound: inbound ? {
                departure: inbound.segments[0].departure,
                arrival: inbound.segments[inbound.segments.length - 1].arrival,
                duration: formatDuration(inbound.duration),
                stops: inbound.segments.length - 1,
                segments: inbound.segments.map(seg => ({
                  departure: seg.departure,
                  arrival: seg.arrival,
                  carrier: carriers[seg.carrierCode] || getAirlineName(seg.carrierCode),
                  carrierCode: seg.carrierCode,
                  flightNumber: `${seg.carrierCode}${seg.number}`,
                  duration: formatDuration(seg.duration),
                  aircraft: seg.aircraft.code,
                })),
              } : null,
              cabinClass: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || "ECONOMY",
              baggage: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.includedCheckedBags,
              validatingAirline: carriers[offer.validatingAirlineCodes[0]] || getAirlineName(offer.validatingAirlineCodes[0]),
              validatingAirlineCode: offer.validatingAirlineCodes[0],
              seatsAvailable: offer.numberOfBookableSeats,
              lastTicketingDate: offer.lastTicketingDate,
            };
          }),
          meta: {
            totalResults: response.data.length,
            carriers,
          },
        };
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
      // P0.5: Output schema added
      .output(LeadCreationOutputSchema)
      .mutation(async ({ input }) => {
        const db = await getDb();
        // P0.1: Remove silent failure - throw explicit error
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
            cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
          });
        }

        const leadData: InsertLead = {
          name: input.name,
          email: input.email,
          phone: input.phone,
          type: input.type,
          origin: input.origin,
          originName: input.originName,
          destination: input.destination,
          destinationName: input.destinationName,
          departureDate: input.departureDate,
          returnDate: input.returnDate,
          adults: input.adults,
          children: input.children,
          infants: input.infants,
          travelClass: input.travelClass,
          flightDetails: input.flightDetails,
          estimatedPrice: input.estimatedPrice,
          message: input.message,
          preferredLanguage: input.preferredLanguage || "en",
        };

        await db.insert(leads).values(leadData);

        const typeLabels = {
          booking: "New Booking Request",
          quote: "New Quote Request",
          contact: "New Contact Message",
        };

        const flightInfo = input.origin && input.destination
          ? `\n\nFlight: ${input.originName || input.origin} → ${input.destinationName || input.destination}\nDate: ${input.departureDate}${input.returnDate ? ` - ${input.returnDate}` : ""}\nPassengers: ${input.adults || 1} adult(s)${input.children ? `, ${input.children} child(ren)` : ""}${input.infants ? `, ${input.infants} infant(s)` : ""}\nClass: ${input.travelClass || "Economy"}${input.estimatedPrice ? `\nEstimated Price: $${input.estimatedPrice}` : ""}`
          : "";

        await notifyOwner({
          title: `${typeLabels[input.type]} - Michel's Travel`,
          content: `Name: ${input.name}\nEmail: ${input.email}${input.phone ? `\nPhone: ${input.phone}` : ""}${flightInfo}${input.message ? `\n\nMessage: ${input.message}` : ""}`,
        });

        return { success: true };
      }),

    // P0.1: Remove silent failure - throw explicit error
    // P0.5: Output schema added
    list: protectedProcedure
      .output(LeadListOutputSchema)
      .query(async () => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
            cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
          });
        }
        
        return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100);
      }),

    // P0.5: Output schema added
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "converted", "closed"]),
      }))
      .output(LeadStatusUpdateOutputSchema)
      .mutation(async ({ input }) => {
        const db = await getDb();
        // P0.1: Remove silent failure - throw explicit error
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
            cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
          });
        }
        
        await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.id));
        return { success: true };
      }),
  }),

  bookings: router({
    // P1.9: Use checkout domain for booking creation
    // P0.7: Square adapter integrated via checkout domain
    // P0.5: Output schema added
    create: protectedProcedure
      .input(z.object({
        origin: z.string().length(3),
        originName: z.string(),
        destination: z.string().length(3),
        destinationName: z.string(),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        adults: z.number().min(1),
        children: z.number().default(0),
        infants: z.number().default(0),
        travelClass: z.string(),
        flightOffer: z.any(),
        totalAmount: z.number(), // in cents
        currency: z.string().default("USD"),
        passengerDetails: z.array(z.object({
          type: z.enum(["adult", "child", "infant"]),
          firstName: z.string(),
          lastName: z.string(),
          dateOfBirth: z.string().optional(),
          passportNumber: z.string().optional(),
        })),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
      }))
      .output(BookingCreationOutputSchema)
      .mutation(async ({ ctx, input }) => {
        // P1.9: Use checkout domain - enforces domain boundaries
        const result = await checkoutDomain.createBookingAndPaymentLink(
          input,
          ctx.user.id,
          ctx.user.email || input.contactEmail,
          ctx.user.name,
          ctx.req.headers.origin
        );

        return {
          bookingId: result.bookingId,
          checkoutUrl: result.checkoutUrl,
          orderId: result.orderId,
        };
      }),

    // P0.5: Output schema added
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .output(BookingOutputSchema)
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        // P0.1: Remove silent failure - throw explicit error
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
            cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
          });
        }

        const booking = await db.select().from(bookings)
          .where(eq(bookings.id, input.id))
          .limit(1);

        if (!booking[0]) return null;
        if (booking[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
            cause: createCanonicalError(ErrorCode.AUTHORIZATION_ERROR, "You do not have permission to access this booking"),
          });
        }

        return booking[0];
      }),

    // P0.1: Remove silent failure - throw explicit error
    // P0.5: Output schema added
    list: protectedProcedure
      .output(BookingListOutputSchema)
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
            cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
          });
        }

        return db.select().from(bookings)
          .where(eq(bookings.userId, ctx.user.id))
          .orderBy(desc(bookings.createdAt))
          .limit(50);
      }),

    // P0.7: Use Square adapter instead of direct Square calls
    // P1.11: Payment verification - booking only confirmed after payment
    // P0.5: Output schema added
    verifyPayment: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .output(PaymentVerificationOutputSchema)
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        // P0.1: Remove silent failure - throw explicit error
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
            cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
          });
        }

        const booking = await db.select().from(bookings)
          .where(eq(bookings.id, input.bookingId))
          .limit(1);

        if (!booking[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Booking not found",
            cause: createCanonicalError(ErrorCode.NOT_FOUND, "Booking not found"),
          });
        }
        if (booking[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
            cause: createCanonicalError(ErrorCode.AUTHORIZATION_ERROR, "You do not have permission to access this booking"),
          });
        }

        // P0.7: Use Square adapter - DOGMA 4: External Service Isolation
        // If booking has Square order ID, check the order status
        if (booking[0].squareOrderId) {
          try {
            const squareAdapter = createSquareAdapter();
            const order = await squareAdapter.getOrder(booking[0].squareOrderId);
            const isPaid = order?.state === "COMPLETED";
            
            // P1.11: Update booking status if paid - enforces payment before ticket
            if (isPaid && booking[0].status === "pending") {
              await db.update(bookings)
                .set({ status: "paid", paidAt: new Date() })
                .where(eq(bookings.id, input.bookingId));
              
              // Notify owner
              await notifyOwner({
                title: "💰 New Flight Booking Paid - Michel's Travel",
                content: `A new booking has been paid!\n\n` +
                  `Booking ID: #${booking[0].id}\n` +
                  `Route: ${booking[0].originName || booking[0].origin} → ${booking[0].destinationName || booking[0].destination}\n` +
                  `Departure: ${booking[0].departureDate}${booking[0].returnDate ? ` | Return: ${booking[0].returnDate}` : ""}\n` +
                  `Passengers: ${booking[0].adults} adult(s)${booking[0].children ? `, ${booking[0].children} child(ren)` : ""}${booking[0].infants ? `, ${booking[0].infants} infant(s)` : ""}\n` +
                  `Class: ${booking[0].travelClass}\n` +
                  `Total Paid: $${(booking[0].totalAmount / 100).toFixed(2)} ${booking[0].currency}\n` +
                  `Contact: ${booking[0].contactEmail}${booking[0].contactPhone ? ` | ${booking[0].contactPhone}` : ""}`,
              });
              
              return {
                status: "paid" as const,
                booking: { ...booking[0], status: "paid" as const },
              };
            }
            
            return {
              status: (order?.state || booking[0].status) as "pending" | "paid" | "confirmed" | "cancelled" | "refunded" | "completed",
              booking: booking[0],
            };
          } catch (error) {
            console.error("[Bookings] Error checking Square order:", error);
            // Don't fail the request if Square check fails - return current booking status
          }
        }

        return {
          status: booking[0].status as "pending" | "paid" | "confirmed" | "cancelled" | "refunded" | "completed",
          booking: booking[0],
        };
      }),

    // P0.1: Remove silent failure - throw explicit error
    // P0.5: Output schema added
    listAll: protectedProcedure
      .output(BookingListOutputSchema)
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
            cause: createCanonicalError(ErrorCode.AUTHORIZATION_ERROR, "Admin access required"),
          });
        }
        
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
            cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
          });
        }

        return db.select().from(bookings)
          .orderBy(desc(bookings.createdAt))
          .limit(100);
      }),
  }),

  chat: router({
    // P0.5: Output schema added
    sendMessage: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        message: z.string(),
        language: z.enum(["en", "pt", "es"]).default("en"),
      }))
      .output(ChatMessageOutputSchema)
      .mutation(async ({ input }) => {
        const systemPrompts: Record<string, string> = {
          en: `You are a helpful travel assistant for Michel's Travel agency. You help customers with:
- Information about travel destinations worldwide
- Required documentation (visas, passports, vaccinations)
- Best seasons to visit different places
- Flight search assistance
- General travel tips and recommendations

Be friendly, professional, and concise. If asked about booking flights, guide them to use our flight search feature or contact us for personalized assistance.`,
          pt: `Você é um assistente de viagens da agência Michel's Travel. Você ajuda clientes com:
- Informações sobre destinos de viagem no mundo todo
- Documentação necessária (vistos, passaportes, vacinas)
- Melhores épocas para visitar diferentes lugares
- Assistência na busca de voos
- Dicas e recomendações gerais de viagem

Seja amigável, profissional e conciso. Se perguntarem sobre reservar voos, oriente-os a usar nosso buscador de voos ou entrar em contato para assistência personalizada.`,
          es: `Eres un asistente de viajes de la agencia Michel's Travel. Ayudas a los clientes con:
- Información sobre destinos de viaje en todo el mundo
- Documentación requerida (visas, pasaportes, vacunas)
- Mejores temporadas para visitar diferentes lugares
- Asistencia en búsqueda de vuelos
- Consejos y recomendaciones generales de viaje

Sé amable, profesional y conciso. Si preguntan sobre reservar vuelos, guíalos a usar nuestro buscador de vuelos o contactarnos para asistencia personalizada.`,
        };

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompts[input.language] },
            { role: "user", content: input.message },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof rawContent === 'string' 
          ? rawContent 
          : Array.isArray(rawContent) 
            ? rawContent.map(c => 'text' in c ? c.text : '').join('') 
            : "I apologize, I couldn't process your request. Please try again.";

        return {
          response: assistantMessage,
          sessionId: input.sessionId,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
