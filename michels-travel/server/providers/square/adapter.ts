/**
 * SQUARE PAYMENT ADAPTER (P0.7, DOGMA 4)
 * 
 * This module isolates all Square API interactions behind a clean interface,
 * ensuring that core business logic does not depend on Square's SDK directly.
 * 
 * DOGMA 4: External Service Isolation
 * - All Square API calls go through this adapter
 * - Core business logic never imports Square SDK directly
 * - Easy to swap Square for another payment provider
 * 
 * @see CODEX_TECHNICUS.md for architectural principles
 */

import { SquareClient, SquareEnvironment, SquareError, Currency } from "square";
import { AppError, ErrorCode, ExternalAPIError } from "../../_core/canonicalErrors";

// Initialize Square client
// Detect environment based on Application ID prefix
// Sandbox IDs start with "sandbox-sq0" while Production IDs start with "sq0"
const isProduction = process.env.SQUARE_APPLICATION_ID?.startsWith("sq0idp-") || 
                     process.env.SQUARE_APPLICATION_ID?.startsWith("sq0idp--");

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || "",
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

/**
 * Square Payment Adapter Interface
 * 
 * This interface abstracts Square-specific operations,
 * allowing easy substitution of payment providers.
 */
export interface SquarePaymentAdapter {
  /**
   * Create a payment link for a booking
   */
  createPaymentLink(params: {
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
  }): Promise<{ url: string; orderId: string }>;

  /**
   * Get order details by order ID
   */
  getOrder(orderId: string): Promise<{ state: string } | null>;

  /**
   * Create a refund for a payment
   */
  createRefund(params: {
    paymentId: string;
    amount: number; // in cents, required for refund
    currency?: string;
    reason?: string;
  }): Promise<{ refundId: string }>;

  /**
   * Validate Square credentials
   */
  validateCredentials(): Promise<boolean>;
}

/**
 * Get the main location ID for the Square account
 */
async function getMainLocationId(): Promise<string> {
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
    console.error("[Square Adapter] Error getting location:", error);
    throw error;
  }
}

/**
 * Create a Square Payment Adapter instance
 * 
 * This factory function returns an adapter that implements the SquarePaymentAdapter interface.
 * All Square API interactions are encapsulated here.
 */
export function createSquareAdapter(): SquarePaymentAdapter {
  return {
    async createPaymentLink(params) {
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
          throw new AppError(500, "Failed to create payment link", true, ErrorCode.EXTERNAL_API_ERROR);
        }

        return {
          url: paymentLink.url,
          orderId: paymentLink.orderId,
        };
      } catch (error: unknown) {
        console.error("[Square Adapter] Error creating payment link", { 
          error: error instanceof Error ? error.message : String(error) 
        });
        if (error instanceof SquareError) {
          throw new ExternalAPIError("Square", `Failed to create payment link: ${error.errors?.[0]?.detail || error.message}`, error);
        }
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(500, "Failed to create payment link", true, ErrorCode.EXTERNAL_API_ERROR, error);
      }
    },

    async getOrder(orderId: string) {
      try {
        const response = await squareClient.orders.get({ orderId });
        if (!response.order) {
          return null;
        }
        return {
          state: response.order.state || "UNKNOWN",
        };
      } catch (error: unknown) {
        console.error("[Square Adapter] Error getting order", { 
          orderId, 
          error: error instanceof Error ? error.message : String(error) 
        });
        if (error instanceof SquareError) {
          throw new ExternalAPIError("Square", `Failed to get order: ${error.errors?.[0]?.detail || error.message}`, error);
        }
        throw new AppError(500, "Failed to get order", true, ErrorCode.EXTERNAL_API_ERROR, error);
      }
    },

    async createRefund(params) {
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
          throw new AppError(500, "Failed to create refund", true, ErrorCode.EXTERNAL_API_ERROR);
        }
        
        return { refundId: refund.id };
      } catch (error: unknown) {
        console.error("[Square Adapter] Error creating refund", { 
          paymentId: params.paymentId, 
          error: error instanceof Error ? error.message : String(error) 
        });
        if (error instanceof SquareError) {
          throw new ExternalAPIError("Square", `Failed to create refund: ${error.errors?.[0]?.detail || error.message}`, error);
        }
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(500, "Failed to create refund", true, ErrorCode.EXTERNAL_API_ERROR, error);
      }
    },

    async validateCredentials() {
      try {
        const response = await squareClient.locations.list();
        return (response.locations?.length || 0) > 0;
      } catch (error: unknown) {
        console.error("[Square Adapter] Credential validation failed", { 
          error: error instanceof Error ? error.message : String(error) 
        });
        return false;
      }
    },
  };
}

