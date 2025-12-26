/**
 * OUTPUT SCHEMAS (P0.5)
 * 
 * This module defines Zod schemas for all API output types,
 * ensuring contract-first design and type safety.
 * 
 * LAW 3.2: All API outputs must have explicit schemas
 * 
 * @see CODEX_TECHNICUS.md for architectural principles
 */

import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

export const LocationSchema = z.object({
  code: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  type: z.enum(["AIRPORT", "CITY"]),
  label: z.string(),
});

export const FlightSegmentSchema = z.object({
  departure: z.object({
    iataCode: z.string(),
    at: z.string(),
  }),
  arrival: z.object({
    iataCode: z.string(),
    at: z.string(),
  }),
  carrier: z.string(),
  carrierCode: z.string(),
  flightNumber: z.string(),
  duration: z.string(),
  aircraft: z.string(),
});

export const FlightLegSchema = z.object({
  departure: z.object({
    iataCode: z.string(),
    at: z.string(),
  }),
  arrival: z.object({
    iataCode: z.string(),
    at: z.string(),
  }),
  duration: z.string(),
  stops: z.number(),
  segments: z.array(FlightSegmentSchema),
});

export const FlightSchema = z.object({
  id: z.string(),
  price: z.object({
    total: z.string(),
    currency: z.string(),
    base: z.string(),
  }),
  outbound: FlightLegSchema,
  inbound: FlightLegSchema.nullable(),
  cabinClass: z.string(),
  baggage: z.any().optional(),
  validatingAirline: z.string(),
  validatingAirlineCode: z.string(),
  seatsAvailable: z.number().optional(),
  lastTicketingDate: z.string().optional(),
});

// ============================================================================
// Auth Output Schemas
// ============================================================================

export const AuthMeOutputSchema = z.object({
  id: z.number(),
  openId: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  role: z.enum(["user", "admin"]).default("user"),
  loginMethod: z.string().nullable(),
  lastSignedIn: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).nullable();

export const AuthLogoutOutputSchema = z.object({
  success: z.literal(true),
});

// ============================================================================
// Flight Search Output Schemas
// ============================================================================

export const LocationSearchOutputSchema = z.array(LocationSchema);

export const FlightSearchOutputSchema = z.object({
  flights: z.array(FlightSchema),
  meta: z.object({
    totalResults: z.number(),
    carriers: z.record(z.string(), z.string()),
    searchId: z.string().optional(),
    expiresAt: z.string().optional(),
    offerRequestId: z.string().optional(),
  }),
});

export const OfferRevalidationOutputSchema = z.object({
  valid: z.boolean(),
  reason: z.enum(["UNAVAILABLE", "PRICE_CHANGED"]).optional(),
  message: z.string().optional(),
  offer: z.object({
    id: z.string(),
    duffelOfferId: z.string(),
    duffelOfferRequestId: z.string(),
    price: z.object({
      total: z.string(),
      currency: z.string(),
      base: z.string(),
    }),
  }).optional(),
  expiresAt: z.string().optional(),
});

// ============================================================================
// Lead Output Schemas
// ============================================================================

export const LeadCreationOutputSchema = z.object({
  success: z.literal(true),
});

export const LeadListOutputSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  type: z.enum(["booking", "quote", "contact"]),
  status: z.enum(["new", "contacted", "converted", "closed"]).default("new"),
  origin: z.string().nullable(),
  originName: z.string().nullable(),
  destination: z.string().nullable(),
  destinationName: z.string().nullable(),
  departureDate: z.string().nullable(),
  returnDate: z.string().nullable(),
  adults: z.number().nullable(),
  children: z.number().nullable(),
  infants: z.number().nullable(),
  travelClass: z.string().nullable(),
  flightDetails: z.any().nullable(),
  estimatedPrice: z.string().nullable(),
  message: z.string().nullable(),
  preferredLanguage: z.string().nullable().or(z.string().default("en")),
  createdAt: z.date(),
  updatedAt: z.date(),
}).passthrough());

export const LeadStatusUpdateOutputSchema = z.object({
  success: z.literal(true),
});

// ============================================================================
// Booking Output Schemas
// ============================================================================

export const BookingCreationOutputSchema = z.object({
  bookingId: z.number(),
  checkoutUrl: z.string().url(),
  orderId: z.string(),
});

// Booking schema - uses z.any() to accommodate all database fields
// Database schema has many optional fields that may not always be present
export const BookingOutputSchema = z.any().nullable();

export const BookingListOutputSchema = z.array(BookingOutputSchema);

export const PaymentVerificationOutputSchema = z.object({
  status: z.enum(["pending", "paid", "confirmed", "cancelled", "refunded", "completed"]),
  booking: z.any().nullable(), // BookingOutputSchema
});

// ============================================================================
// Chat Output Schemas
// ============================================================================

export const ChatMessageOutputSchema = z.object({
  response: z.string(),
  sessionId: z.string(),
});

