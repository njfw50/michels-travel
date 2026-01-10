import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./_core/password";
import { getUserByEmail, upsertUser, getDbType } from "./db";
import { sdk } from "./_core/sdk";
// DOGMA 11: Duffel is the canonical flight search API - never use Amadeus
import { searchFlights, searchLocations, getAirlineName, formatDuration, FlightSearchParams } from "./duffel";
import { getDb } from "./db";
import { leads, flightSearches, InsertLead } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  
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

        // Create user
        // DOGMA 10: lastSignedIn must be Date object (Drizzle converts to integer for SQLite)
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
    // Login with email/password - DOGMA 3: Validate ALL Inputs with Zod
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
          // DOGMA 2: No Silent Failures - All Errors Are Explicit
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database initialization failed. Please check your DATABASE_URL configuration and ensure the database file is accessible.",
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
        // DOGMA 11: Tratamento explícito de erros de API
        try {
          // DOGMA 11: Duffel API - mapear parâmetros corretamente
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
                lowestPrice: response.data?.[0]?.total_amount ? parseFloat(response.data[0].total_amount) : null,
              });
            } catch (e) {
              console.error("Failed to log search:", e);
            }
          }

          // DOGMA 11: Mapear resposta do Duffel corretamente (formato diferente do Amadeus)
          return {
            flights: response.data.map(offer => {
              const outbound = offer.slices[0];
              const inbound = offer.slices[1];
              
              return {
                id: offer.id,
                price: {
                  total: offer.total_amount,
                  currency: offer.total_currency,
                  base: offer.total_amount, // Duffel não separa base/total da mesma forma
                },
                outbound: {
                  departure: {
                    iataCode: outbound.origin.iata_code,
                    at: outbound.segments[0]?.departing_at || "",
                  },
                  arrival: {
                    iataCode: outbound.destination.iata_code,
                    at: outbound.segments[outbound.segments.length - 1]?.arriving_at || "",
                  },
                  duration: outbound.duration,
                  stops: outbound.segments.length - 1,
                  segments: outbound.segments.map(seg => ({
                    departure: {
                      iataCode: seg.origin.iata_code,
                      at: seg.departing_at,
                    },
                    arrival: {
                      iataCode: seg.destination.iata_code,
                      at: seg.arriving_at,
                    },
                    carrier: seg.marketing_carrier.name,
                    carrierCode: seg.marketing_carrier.iata_code,
                    flightNumber: seg.marketing_carrier_flight_number,
                    duration: seg.duration,
                    aircraft: seg.aircraft?.name || seg.aircraft?.id || "",
                  })),
                },
                inbound: inbound ? {
                  departure: {
                    iataCode: inbound.origin.iata_code,
                    at: inbound.segments[0]?.departing_at || "",
                  },
                  arrival: {
                    iataCode: inbound.destination.iata_code,
                    at: inbound.segments[inbound.segments.length - 1]?.arriving_at || "",
                  },
                  duration: inbound.duration,
                  stops: inbound.segments.length - 1,
                  segments: inbound.segments.map(seg => ({
                    departure: {
                      iataCode: seg.origin.iata_code,
                      at: seg.departing_at,
                    },
                    arrival: {
                      iataCode: seg.destination.iata_code,
                      at: seg.arriving_at,
                    },
                    carrier: seg.marketing_carrier.name,
                    carrierCode: seg.marketing_carrier.iata_code,
                    flightNumber: seg.marketing_carrier_flight_number,
                    duration: seg.duration,
                    aircraft: seg.aircraft?.name || seg.aircraft?.id || "",
                  })),
                } : null,
                cabinClass: params.cabinClass?.toUpperCase() || "ECONOMY",
                baggage: undefined, // Duffel estrutura diferente
                validatingAirline: offer.owner.name,
                validatingAirlineCode: offer.owner.iata_code,
                seatsAvailable: undefined, // Duffel estrutura diferente
                lastTicketingDate: undefined, // Duffel estrutura diferente
              };
            }),
            meta: {
              totalResults: response.data.length,
              carriers: {}, // Duffel não retorna dicionário de carriers
            },
          };
        } catch (error: any) {
          // DOGMA 11: Tratamento explícito de erros - retornar erro amigável
          const errorMessage = error.message || "Failed to search flights";
          
          // DOGMA 2: No silent failures - log em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.error("[Flight API] Search error:", error);
          }
          
          // DOGMA 11: Retornar erro TRPC apropriado, não lançar exceção não tratada
          throw new TRPCError({
            code: errorMessage.includes("not configured") ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
            message: errorMessage.includes("not configured") 
              ? "Flight search API is not configured. Please configure DUFFEL_API_KEY in your .env file."
              : "Unable to search flights at this time. Please try again later.",
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
          throw new Error("Database initialization failed. Please check your DATABASE_URL configuration.");
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

    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100);
    }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "converted", "closed"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          // DOGMA 10: Database Auto-Initialization - This should never happen
          throw new Error("Database initialization failed. Please check your DATABASE_URL configuration.");
        }
        
        await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.id));
        return { success: true };
      }),
  }),

  chat: router({
    sendMessage: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        message: z.string(),
        language: z.enum(["en", "pt", "es"]).default("en"),
      }))
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
