import { SquareClient, SquareEnvironment, SquareError, Currency } from "square";

// Initialize Square client
// Detect environment based on Application ID prefix
// Sandbox IDs start with "sandbox-sq0" while Production IDs start with "sq0"
const isProduction = process.env.SQUARE_APPLICATION_ID?.startsWith("sq0idp-") || 
                     process.env.SQUARE_APPLICATION_ID?.startsWith("sq0idp--");

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || "",
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

export { squareClient };

/**
 * Get the main location ID for the Square account
 */
export async function getMainLocationId(): Promise<string> {
  try {
    const response = await squareClient.locations.list();
    const locations = response.locations || [];
    
    if (locations.length === 0) {
      throw new Error("No Square locations found");
    }
    
    // Return the first active location
    const activeLocation = locations.find((loc) => loc.status === "ACTIVE") || locations[0];
    return activeLocation.id!;
  } catch (error: unknown) {
    console.error("[Square] Error getting location:", error);
    throw error;
  }
}

/**
 * Create a Square Checkout payment link
 */
export async function createCheckoutLink(params: {
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
  customerEmail: string;
  customerName?: string;
  redirectUrl: string;
}): Promise<{ url: string; orderId: string }> {
  try {
    const locationId = await getMainLocationId();
    
    // Create a unique idempotency key
    const idempotencyKey = `booking-${params.bookingId}-${Date.now()}`;
    
    // Create the checkout link using Payment Links API
    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey,
      order: {
        locationId,
        referenceId: `booking-${params.bookingId}`,
        lineItems: [
          {
            name: `Flight: ${params.origin} → ${params.destination}`,
            quantity: "1",
            note: params.flightDescription,
            basePriceMoney: {
              amount: BigInt(params.totalAmount),
              currency: params.currency.toUpperCase() as Currency,
            },
          },
        ],
        metadata: {
          bookingId: params.bookingId.toString(),
          customerEmail: params.customerEmail,
          customerName: params.customerName || "",
          departureDate: params.departureDate,
          returnDate: params.returnDate || "",
          passengers: params.passengers.toString(),
          travelClass: params.travelClass,
        },
      },
      checkoutOptions: {
        redirectUrl: params.redirectUrl,
        askForShippingAddress: false,
        merchantSupportEmail: "support@michelstravel.com",
      },
      prePopulatedData: {
        buyerEmail: params.customerEmail,
      },
    });

    const paymentLink = response.paymentLink;
    if (!paymentLink?.url || !paymentLink?.orderId) {
      throw new Error("Failed to create payment link");
    }

    return {
      url: paymentLink.url,
      orderId: paymentLink.orderId,
    };
  } catch (error: unknown) {
    if (error instanceof SquareError) {
      console.error("[Square] API Error:", error.message);
      throw new Error(`Square API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get order details by order ID
 */
export async function getOrder(orderId: string) {
  try {
    const response = await squareClient.orders.get({ orderId });
    return response.order;
  } catch (error: unknown) {
    if (error instanceof SquareError) {
      console.error("[Square] API Error getting order:", error.message);
    }
    throw error;
  }
}

/**
 * Verify Square webhook signature using the helper
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  signatureKey: string,
  notificationUrl: string
): boolean {
  const crypto = require("crypto");
  const combined = notificationUrl + body;
  const expectedSignature = crypto
    .createHmac("sha256", signatureKey)
    .update(combined)
    .digest("base64");
  
  return signature === expectedSignature;
}

/**
 * Process a refund for a payment
 */
export async function createRefund(params: {
  paymentId: string;
  amount: number; // in cents, required for refund
  currency?: string;
  reason?: string;
}): Promise<{ refundId: string }> {
  try {
    const idempotencyKey = `refund-${params.paymentId}-${Date.now()}`;
    
    const response = await squareClient.refunds.refundPayment({
      idempotencyKey,
      paymentId: params.paymentId,
      reason: params.reason || "Customer requested refund",
      amountMoney: {
        amount: BigInt(params.amount),
        currency: (params.currency || "USD") as Currency,
      },
    });
    
    const refund = response.refund;
    if (!refund?.id) {
      throw new Error("Failed to create refund");
    }
    
    return { refundId: refund.id };
  } catch (error: unknown) {
    if (error instanceof SquareError) {
      console.error("[Square] API Error creating refund:", error.message);
      throw new Error(`Square API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate Square credentials by listing locations
 */
export async function validateCredentials(): Promise<boolean> {
  try {
    const response = await squareClient.locations.list();
    return (response.locations?.length || 0) > 0;
  } catch (error: unknown) {
    console.error("[Square] Credential validation failed:", error);
    return false;
  }
}
