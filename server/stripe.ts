import Stripe from "stripe";
import { ENV } from "./_core/env";

/**
 * Stripe Payment Integration
 * DOGMA 4: External Service Isolation - All Stripe calls go through this module
 */

let stripeClient: Stripe | null = null;

/**
 * Get or create Stripe client instance
 * DOGMA 2: No silent failures - validate API key
 */
function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey || secretKey.trim() === "") {
    if (ENV.isProduction) {
      throw new Error(
        "STRIPE_SECRET_KEY is required in production. " +
        "Please configure STRIPE_SECRET_KEY in your .env file."
      );
    } else {
      console.warn(
        "[Stripe] ⚠️ STRIPE_SECRET_KEY not configured. " +
        "Payment features will not work. Set STRIPE_SECRET_KEY in .env to enable."
      );
      // Return a mock client that throws errors when used
      throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env file.");
    }
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  });

  return stripeClient;
}

/**
 * Create a PaymentIntent for a flight order
 * DOGMA 4: External Service Isolation - All Stripe calls go through this module
 * 
 * @param params - Payment intent parameters
 * @returns PaymentIntent with client_secret for frontend
 */
export async function createPaymentIntent(params: {
  amount: number; // in cents
  currency: string;
  customerEmail: string;
  customerName?: string;
  orderId: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}): Promise<{
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}> {
  try {
    const stripe = getStripeClient();

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        customer_email: params.customerEmail,
        metadata: {
          orderId: params.orderId,
          ...(params.customerName && { customerName: params.customerName }),
          ...params.metadata,
        },
        description: `Flight booking - Order ${params.orderId}`,
      },
      {
        idempotencyKey: params.idempotencyKey,
      }
    );

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create payment intent: missing client_secret");
    }

    return {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  } catch (error: any) {
    console.error("[Stripe] PaymentIntent creation error:", {
      error: error.message,
      type: error.type,
      code: error.code,
    });

    if (error.type === "StripeInvalidRequestError") {
      throw new Error(`Invalid payment request: ${error.message}`);
    }

    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

/**
 * Retrieve a PaymentIntent by ID
 * DOGMA 4: External Service Isolation
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<{
  id: string;
  status: string;
  amount: number;
  currency: string;
  customer_email?: string;
}> {
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_email: paymentIntent.receipt_email || undefined,
    };
  } catch (error: any) {
    console.error("[Stripe] PaymentIntent retrieval error:", error.message);
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
}

/**
 * Confirm a PaymentIntent (for server-side confirmation if needed)
 * DOGMA 4: External Service Isolation
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<{
  id: string;
  status: string;
}> {
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      ...(paymentMethodId && { payment_method: paymentMethodId }),
    });

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error: any) {
    console.error("[Stripe] PaymentIntent confirmation error:", error.message);
    throw new Error(`Failed to confirm payment intent: ${error.message}`);
  }
}

