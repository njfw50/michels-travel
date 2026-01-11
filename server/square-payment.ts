import { ENV } from "./_core/env";
import { SquareClient, SquareEnvironment, SquareError, Currency } from "square";
import { decryptSensitiveData, isEncrypted } from "./_core/security";

/**
 * Square Payment Integration for Checkout Flow
 * DOGMA 4: External Service Isolation - All Square calls go through this module
 * 
 * This module provides payment functions compatible with the checkout flow,
 * using Square Payment Links API.
 */

/**
 * Get Square environment configuration
 * Supports switching between Sandbox and Production via SQUARE_ENVIRONMENT variable
 * 
 * Environment variables:
 * - SQUARE_ENVIRONMENT: "sandbox" | "production" (default: "sandbox")
 * - SQUARE_ACCESS_TOKEN_SANDBOX: Access token for sandbox
 * - SQUARE_APPLICATION_ID_SANDBOX: Application ID for sandbox
 * - SQUARE_ACCESS_TOKEN_PRODUCTION: Access token for production
 * - SQUARE_APPLICATION_ID_PRODUCTION: Application ID for production
 * 
 * Legacy support (backward compatibility):
 * - SQUARE_ACCESS_TOKEN: Used if environment-specific token not found
 * - SQUARE_APPLICATION_ID: Used if environment-specific ID not found
 */
function getSquareEnvironment(): {
  environment: SquareEnvironment;
  accessToken: string;
  applicationId: string;
} {
  const envMode = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  const useProduction = envMode === "production";

  // Get environment-specific credentials
  let accessToken = useProduction
    ? (process.env.SQUARE_ACCESS_TOKEN_PRODUCTION || process.env.SQUARE_ACCESS_TOKEN || "")
    : (process.env.SQUARE_ACCESS_TOKEN_SANDBOX || process.env.SQUARE_ACCESS_TOKEN || "");

  const applicationId = useProduction
    ? (process.env.SQUARE_APPLICATION_ID_PRODUCTION || process.env.SQUARE_APPLICATION_ID || "")
    : (process.env.SQUARE_APPLICATION_ID_SANDBOX || process.env.SQUARE_APPLICATION_ID || "");

  // DOGMA 1: Security First - Decrypt access token if encrypted
  if (accessToken && isEncrypted(accessToken)) {
    try {
      accessToken = decryptSensitiveData(accessToken);
    } catch (error: any) {
      throw new Error(
        `Failed to decrypt Square access token: ${error.message}. ` +
        `Please check your ENCRYPTION_KEY configuration.`
      );
    }
  }

  return {
    environment: useProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    accessToken,
    applicationId,
  };
}

// Initialize Square client with environment detection
// Note: Client is re-initialized in functions to handle environment changes
// This is just for type reference

/**
 * Create a payment link for a flight order
 * DOGMA 4: External Service Isolation - All Square calls go through this module
 * 
 * @param params - Payment link parameters
 * @returns Payment link URL and order ID
 */
export async function createPaymentLink(params: {
  amount: number; // in cents
  currency: string;
  customerEmail: string;
  customerName?: string;
  orderId: string;
  idempotencyKey: string;
  offerId: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  travelClass: string;
  redirectUrl: string;
}): Promise<{
  url: string;
  orderId: string;
  paymentLinkId?: string;
}> {
  try {
    // Validate Square credentials
    const squareConfig = getSquareEnvironment();
    const envMode = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
    
    if (!squareConfig.accessToken || !squareConfig.applicationId) {
      const envName = envMode === "production" ? "production" : "sandbox";
      const tokenVar = envMode === "production" 
        ? "SQUARE_ACCESS_TOKEN_PRODUCTION" 
        : "SQUARE_ACCESS_TOKEN_SANDBOX";
      const appIdVar = envMode === "production"
        ? "SQUARE_APPLICATION_ID_PRODUCTION"
        : "SQUARE_APPLICATION_ID_SANDBOX";
      
      throw new Error(
        `Square ${envName} credentials not configured. ` +
        `Please set ${tokenVar} and ${appIdVar} in your .env file, ` +
        `or use SQUARE_ACCESS_TOKEN and SQUARE_APPLICATION_ID for backward compatibility. ` +
        `Current SQUARE_ENVIRONMENT: ${envMode}`
      );
    }
    
    // Log which environment is being used (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Square] Using ${envMode} environment (Application ID: ${squareConfig.applicationId.substring(0, 20)}...)`);
    }

    const locationId = await getMainLocationId();
    const flightDescription = `Flight from ${params.origin} to ${params.destination} on ${params.departureDate}${params.returnDate ? `, return on ${params.returnDate}` : ""}`;
    
    // Create a unique idempotency key
    const idempotencyKey = `order-${params.orderId}-${Date.now()}`;
    
    // Re-initialize client in case environment changed (use squareConfig already declared above)
    const client = new SquareClient({
      accessToken: squareConfig.accessToken,
      environment: squareConfig.environment,
    });
    
    // Use the correct API access method for Square SDK v43+
    const checkoutApi = client.checkout;
    if (!checkoutApi) {
      throw new Error("Square checkout API not available. Please check your Square SDK version and credentials.");
    }
    
    // Create the checkout link using Payment Links API
    const response = await checkoutApi.paymentLinks.create({
      idempotencyKey,
      order: {
        locationId,
        referenceId: `order-${params.orderId}`,
        lineItems: [
          {
            name: `Flight: ${params.origin} → ${params.destination}`,
            quantity: "1",
            note: flightDescription,
            basePriceMoney: {
              amount: BigInt(params.amount),
              currency: params.currency.toUpperCase() as Currency,
            },
          },
        ],
        metadata: {
          orderId: params.orderId,
          offerId: params.offerId,
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

    // In Square SDK v43+, response structure may vary
    const paymentLink = response.paymentLink || response.result?.paymentLink;
    if (!paymentLink?.url || !paymentLink?.orderId) {
      throw new Error("Failed to create payment link: Invalid response structure from Square API");
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
    console.error("[Square] Payment link creation error:", {
      error: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor?.name : typeof error,
    });
    throw error;
  }
}

/**
 * Get the main location ID for the Square account
 * DOGMA 2: No Silent Failures - Explicit error handling
 * 
 * In Square SDK v43+, the locations API is accessed via:
 * - client.locations.list() (not listLocations())
 * - Response structure: response.locations (not response.result.locations)
 */
async function getMainLocationId(): Promise<string> {
  try {
    // Re-initialize client in case environment changed
    const squareConfig = getSquareEnvironment();
    const client = new SquareClient({
      accessToken: squareConfig.accessToken,
      environment: squareConfig.environment,
    });
    
    // Use the correct API access method for Square SDK v43+
    // The locations API is accessed via client.locations.list() (not listLocations())
    const locationsApi = client.locations;
    
    if (!locationsApi) {
      throw new Error("Square locations API not available. Please check your Square SDK version and credentials.");
    }
    
    // Verify the list method exists
    if (typeof locationsApi.list !== 'function') {
      const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(locationsApi))
        .filter(m => m !== 'constructor' && !m.startsWith('_'))
        .slice(0, 10)
        .join(', ');
      throw new Error(
        `Square locations.list is not a function. ` +
        `Please check your Square SDK version (expected v43+). ` +
        `Available methods: ${availableMethods || 'none found'}`
      );
    }
    
    // Call the list method (not listLocations)
    const response = await locationsApi.list();
    
    // In Square SDK v43+, response structure is response.locations (not response.result.locations)
    const locations = response.locations || response.result?.locations;
    
    if (!locations || locations.length === 0) {
      throw new Error("No Square locations found. Please create a location in your Square dashboard.");
    }
    
    // Return the first active location, or the first location if none is active
    const activeLocation = locations.find((loc: any) => loc.status === "ACTIVE") || locations[0];
    const locationId = activeLocation.id;
    
    if (!locationId) {
      throw new Error("Location ID is missing from Square response");
    }
    
    return locationId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Square] Error getting location:", {
      error: errorMessage,
      type: error instanceof Error ? error.constructor?.name : typeof error,
    });
    
    // Provide helpful error message
    if (errorMessage.includes("locations") || errorMessage.includes("list") || errorMessage.includes("not a function")) {
      throw new Error(
        `Square API access error: ${errorMessage}. ` +
        `Please verify your Square credentials and ensure you have at least one location configured in your Square dashboard. ` +
        `If the error persists, check the Square SDK documentation for v43+ API access patterns.`
      );
    }
    
    throw error;
  }
}

/**
 * Get order status by order ID
 * DOGMA 4: External Service Isolation
 */
export async function getOrderStatus(orderId: string): Promise<{
  state: string;
  status: string;
}> {
  try {
    // Re-initialize client in case environment changed
    const squareConfig = getSquareEnvironment();
    const client = new SquareClient({
      accessToken: squareConfig.accessToken,
      environment: squareConfig.environment,
    });
    
    // Use the correct API access method for Square SDK v43+
    const ordersApi = client.orders;
    if (!ordersApi) {
      throw new Error("Square orders API not available");
    }
    
    // In Square SDK v43+, response structure may vary
    const response = await ordersApi.retrieveOrder(orderId);
    const order = response.order || response.result?.order;
    
    if (!order) {
      throw new Error("Order not found");
    }

    // Map Square order state to payment status
    const statusMap: Record<string, string> = {
      DRAFT: "pending",
      OPEN: "pending",
      COMPLETED: "succeeded",
      CANCELED: "cancelled",
    };

    return {
      state: order.state || "UNKNOWN",
      status: statusMap[order.state || ""] || "pending",
    };
  } catch (error: any) {
    console.error("[Square] Order status retrieval error:", error.message);
    throw new Error(`Failed to retrieve order status: ${error.message}`);
  }
}

