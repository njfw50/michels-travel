/**
 * CHECKOUT DOMAIN (P1.9)
 * 
 * This module encapsulates checkout-specific business logic,
 * enforcing domain boundaries and separation of concerns.
 * 
 * P1.9: Domain Boundaries
 * - Search NEVER books
 * - Checkout NEVER processes payment
 * - Payment NEVER books
 * - Fulfillment NEVER processes payment
 * 
 * This domain handles:
 * - Booking record creation (pending state)
 * - Price validation (P1.10)
 * - Payment link initiation (via Square adapter)
 * 
 * @see CODEX_TECHNICUS.md for architectural principles
 */

import { z } from "zod";
import { getDb } from "../../db";
import { bookings, InsertBooking } from "../../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { AppError, ErrorCode, createCanonicalError } from "../../_core/canonicalErrors";
import { BOOKING_FEE, formatPrice } from "../../products";
import { createSquareAdapter } from "../../providers/square/adapter";
import { eq } from "drizzle-orm";

/**
 * Checkout Input Schema
 */
export const CheckoutInputSchema = z.object({
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
  flightOffer: z.any(), // Revalidated flight offer from frontend
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
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

/**
 * Checkout Output Schema
 */
export const CheckoutOutputSchema = z.object({
  bookingId: z.number(),
  checkoutUrl: z.string().url(),
  orderId: z.string(),
  lockedPrice: z.number(),
  expiresAt: z.string(),
});

export type CheckoutOutput = z.infer<typeof CheckoutOutputSchema>;

/**
 * Checkout Domain Class
 * 
 * Encapsulates all checkout-related business logic.
 */
class CheckoutDomain {
  /**
   * Create a booking record and initiate payment link
   * 
   * This method:
   * 1. Validates the flight offer and amount
   * 2. Creates a booking record in "pending" state
   * 3. Creates a Square payment link
   * 4. Updates the booking with the Square order ID
   * 
   * NOTE: This does NOT process payment or issue tickets.
   * Payment processing happens separately via Square webhook/verifyPayment.
   * Ticket issuance happens only after confirmed payment (P1.11).
   */
  async createBookingAndPaymentLink(
    input: CheckoutInput,
    userId: number,
    userEmail: string,
    userName?: string | null,
    originHeader?: string
  ): Promise<CheckoutOutput> {
    const db = await getDb();
    if (!db) {
      throw new AppError(500, "Database not available", true, ErrorCode.DATABASE_ERROR);
    }

    // P1.10: Price revalidation
    // For now, we assume the flightOffer passed from frontend is the revalidated one.
    // A more robust implementation would re-fetch the offer from Duffel here.
    if (!input.flightOffer || input.totalAmount <= 0) {
      throw new AppError(400, "Invalid flight offer or amount", true, ErrorCode.INVALID_INPUT);
    }

    // P1.9: Booking record creation (pending state)
    // Booking is created in "pending" state and will only be confirmed after payment
    const bookingData: InsertBooking = {
      userId: userId,
      status: "pending",
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
      flightOffer: input.flightOffer,
      totalAmount: input.totalAmount + BOOKING_FEE.amount, // Add service fee
      currency: input.currency,
      passengerDetails: input.passengerDetails,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    };

    const result = await db.insert(bookings).values(bookingData);
    const bookingId = Number(result[0].insertId);
    console.log("[Checkout Domain] Booking record created in pending state", { bookingId, userId });

    // Create flight description for Square
    const flightDescription = `${input.originName} (${input.origin}) → ${input.destinationName} (${input.destination})\n` +
      `Departure: ${input.departureDate}${input.returnDate ? ` | Return: ${input.returnDate}` : ""}\n` +
      `Passengers: ${input.adults} adult(s)${input.children ? `, ${input.children} child(ren)` : ""}${input.infants ? `, ${input.infants} infant(s)` : ""}\n` +
      `Class: ${input.travelClass}\n` +
      `Service Fee: ${formatPrice(BOOKING_FEE.amount)}`;

    const origin = originHeader || "http://localhost:3000";

    // DOGMA 4: External Service Isolation - Use Square adapter
    // P1.9: Checkout initiates payment intent, but doesn't process payment
    const squareAdapter = createSquareAdapter();
    const { url, orderId } = await squareAdapter.createPaymentLink({
      bookingId,
      flightDescription,
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      passengers: input.adults + input.children + input.infants,
      travelClass: input.travelClass,
      totalAmount: input.totalAmount + BOOKING_FEE.amount,
      currency: input.currency,
      customerEmail: userEmail || input.contactEmail,
      customerName: userName || undefined,
      redirectUrl: `${origin}/booking/success?booking_id=${bookingId}`,
    });
    console.log("[Checkout Domain] Square payment link created", { bookingId, orderId, url });

    // Update booking with Square order ID
    await db.update(bookings)
      .set({ squareOrderId: orderId })
      .where(eq(bookings.id, bookingId));
    console.log("[Checkout Domain] Booking updated with Square Order ID", { bookingId, orderId });

    return {
      bookingId,
      checkoutUrl: url,
      orderId,
      lockedPrice: input.totalAmount + BOOKING_FEE.amount,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes expiry
    };
  }
}

export const checkoutDomain = new CheckoutDomain();

