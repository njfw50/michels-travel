import { Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent } from "./stripe";
import { getDb } from "./db";
import { bookings, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).send(`Webhook signature verification failed`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    res.status(500).send("Webhook processing failed");
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  if (!bookingId) {
    console.error("[Stripe Webhook] No bookingId in session metadata");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  // Update booking status to paid
  await db.update(bookings)
    .set({
      status: "paid",
      stripePaymentIntentId: session.payment_intent as string,
      paidAt: new Date(),
    })
    .where(eq(bookings.id, parseInt(bookingId)));

  // Update user's Stripe customer ID if not set
  if (userId && customerId) {
    await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, parseInt(userId)));
  }

  // Get booking details for notification
  const booking = await db.select().from(bookings)
    .where(eq(bookings.id, parseInt(bookingId)))
    .limit(1);

  if (booking[0]) {
    const b = booking[0];
    
    // Notify owner of new paid booking
    await notifyOwner({
      title: "💰 New Flight Booking Paid - Michel's Travel",
      content: `A new booking has been paid!\n\n` +
        `Booking ID: #${b.id}\n` +
        `Route: ${b.originName || b.origin} → ${b.destinationName || b.destination}\n` +
        `Departure: ${b.departureDate}${b.returnDate ? ` | Return: ${b.returnDate}` : ""}\n` +
        `Passengers: ${b.adults} adult(s)${b.children ? `, ${b.children} child(ren)` : ""}${b.infants ? `, ${b.infants} infant(s)` : ""}\n` +
        `Class: ${b.travelClass}\n` +
        `Total Paid: $${(b.totalAmount / 100).toFixed(2)} ${b.currency}\n` +
        `Contact: ${b.contactEmail}${b.contactPhone ? ` | ${b.contactPhone}` : ""}`,
    });
  }

  console.log(`[Stripe Webhook] Booking #${bookingId} marked as paid`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) {
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Keep booking as pending, user can retry
  console.log(`[Stripe Webhook] Payment failed for booking #${bookingId}`);
}

/**
 * Handle refund
 */
async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Find booking by payment intent and mark as refunded
  const booking = await db.select().from(bookings)
    .where(eq(bookings.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (booking[0]) {
    await db.update(bookings)
      .set({ status: "refunded" })
      .where(eq(bookings.id, booking[0].id));

    console.log(`[Stripe Webhook] Booking #${booking[0].id} marked as refunded`);

    // Notify owner
    await notifyOwner({
      title: "🔄 Booking Refunded - Michel's Travel",
      content: `Booking #${booking[0].id} has been refunded.\n\n` +
        `Route: ${booking[0].originName || booking[0].origin} → ${booking[0].destinationName || booking[0].destination}\n` +
        `Amount: $${(booking[0].totalAmount / 100).toFixed(2)} ${booking[0].currency}`,
    });
  }
}
