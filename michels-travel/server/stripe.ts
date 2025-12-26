import Stripe from "stripe";
import { ENV } from "./_core/env";

// Initialize Stripe with secret key
const stripe = new Stripe(ENV.stripeSecretKey || "");

export { stripe };

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: number,
  email: string,
  name?: string | null,
  existingCustomerId?: string | null
): Promise<string> {
  // If customer already exists, return their ID
  if (existingCustomerId) {
    return existingCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId: userId.toString(),
    },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout Session for flight booking
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName?: string | null;
  stripeCustomerId?: string | null;
  bookingId: number;
  flightDescription: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  travelClass: string;
  totalAmount: number; // in cents
  currency: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  // Get or create customer
  const customerId = await getOrCreateCustomer(
    params.userId,
    params.userEmail,
    params.userName,
    params.stripeCustomerId
  );

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: params.userId.toString(),
    mode: "payment",
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `Flight: ${params.origin} → ${params.destination}`,
            description: params.flightDescription,
            metadata: {
              bookingId: params.bookingId.toString(),
              origin: params.origin,
              destination: params.destination,
              departureDate: params.departureDate,
              returnDate: params.returnDate || "",
              passengers: params.passengers.toString(),
              travelClass: params.travelClass,
            },
          },
          unit_amount: params.totalAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: params.bookingId.toString(),
      userId: params.userId.toString(),
      customerEmail: params.userEmail,
      customerName: params.userName || "",
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate || "",
    },
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${params.bookingId}`,
    cancel_url: `${params.cancelUrl}?booking_id=${params.bookingId}`,
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "customer"],
  });
}

/**
 * Verify webhook signature and construct event
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = ENV.stripeWebhookSecret;
  
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Create a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number, // in cents, if partial refund
  reason?: "duplicate" | "fraudulent" | "requested_by_customer"
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
}
