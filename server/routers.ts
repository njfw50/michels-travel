import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { searchFlights, searchLocations, getAirlineName, formatDuration, FlightSearchParams } from "./amadeus";
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
  }),

  flights: router({
    searchLocations: publicProcedure
      .input(z.object({ keyword: z.string().min(2) }))
      .query(async ({ input }) => {
        const results = await searchLocations(input.keyword);
        return results.map(loc => ({
          code: loc.iataCode,
          name: loc.name,
          city: loc.address.cityName,
          country: loc.address.countryName,
          type: loc.subType,
          label: `${loc.name} (${loc.iataCode}) - ${loc.address.cityName}, ${loc.address.countryName}`,
        }));
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
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

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
        if (!db) throw new Error("Database not available");
        
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
