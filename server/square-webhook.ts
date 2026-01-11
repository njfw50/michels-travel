/**
 * Square Webhook Handler
 * 
 * Handles Square webhook events for payment notifications.
 * DOGMA 1: Security First - Verify webhook signatures
 * DOGMA 2: No Silent Failures - Explicit error handling
 * DOGMA 4: External Service Isolation - All Square webhook logic here
 * 
 * CRITICAL: Automatically creates Duffel order after payment confirmation
 * to ensure tickets are issued even if user doesn't return to checkout page.
 */

import { Request, Response } from "express";
import { SquareClient, SquareEnvironment } from "square";
import { getDb } from "./db";
import { getOrdersTable } from "./routers";
import { eq } from "drizzle-orm";
import { getOrderStatus } from "./square-payment";
import { notifyOwner } from "./_core/notification";
import { logAuditEvent } from "./_core/audit";
import { decryptSensitiveData, isEncrypted } from "./_core/security";
import { createOrder as createDuffelOrder, CreateOrderParams } from "./duffel";

/**
 * Get Square environment configuration
 */
function getSquareEnvironment(): {
  environment: SquareEnvironment;
  accessToken: string;
  webhookSignatureKey?: string;
} {
  const envMode = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  const useProduction = envMode === "production";

  let accessToken = useProduction
    ? (process.env.SQUARE_ACCESS_TOKEN_PRODUCTION || process.env.SQUARE_ACCESS_TOKEN || "")
    : (process.env.SQUARE_ACCESS_TOKEN_SANDBOX || process.env.SQUARE_ACCESS_TOKEN || "");

  const webhookSignatureKey = useProduction
    ? (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_PRODUCTION || process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "")
    : (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_SANDBOX || process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "");

  // Decrypt if encrypted
  if (accessToken && isEncrypted(accessToken)) {
    try {
      accessToken = decryptSensitiveData(accessToken);
    } catch (error: any) {
      console.error("[Square Webhook] Failed to decrypt access token:", error.message);
    }
  }

  return {
    environment: useProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    accessToken,
    webhookSignatureKey,
  };
}

/**
 * Verify webhook signature
 * DOGMA 1: Security First - Always verify webhook signatures
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  signatureKey: string
): boolean {
  if (!signatureKey) {
    console.warn("[Square Webhook] No signature key configured - skipping verification");
    return true; // In development, allow without signature key
  }

  try {
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", signatureKey);
    hmac.update(body);
    const expectedSignature = hmac.digest("base64");
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error: any) {
    console.error("[Square Webhook] Signature verification error:", error.message);
    return false;
  }
}

/**
 * Handle Square webhook events
 * DOGMA 2: No Silent Failures - All errors logged and handled
 */
export async function handleSquareWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers["x-square-signature"] as string;
    const squareConfig = getSquareEnvironment();

    // Verify webhook signature if key is configured
    if (squareConfig.webhookSignatureKey) {
      const bodyString = JSON.stringify(req.body);
      if (!verifyWebhookSignature(bodyString, signature || "", squareConfig.webhookSignatureKey)) {
        console.error("[Square Webhook] Invalid signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    const event = req.body;
    const eventType = event.type;

    console.log(`[Square Webhook] Received event: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case "payment.updated":
      case "order.updated": {
        await handlePaymentUpdated(event);
        break;
      }

      case "payment.created": {
        await handlePaymentCreated(event);
        break;
      }

      default:
        console.log(`[Square Webhook] Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[Square Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle payment updated event
 * DOGMA 2: No Silent Failures - Explicit error handling
 * CRITICAL: Automatically creates Duffel order to issue ticket
 */
async function handlePaymentUpdated(event: any): Promise<void> {
  try {
    const payment = event.data?.object?.payment;
    if (!payment) {
      console.warn("[Square Webhook] No payment data in event");
      return;
    }

    const orderId = payment.order_id;
    if (!orderId) {
      console.warn("[Square Webhook] No order_id in payment");
      return;
    }

    // Find order by Square order ID
    const db = await getDb();
    if (!db) {
      console.error("[Square Webhook] Database not available");
      return;
    }

    const ordersTable = getOrdersTable();
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.paymentIntentId, orderId))
      .limit(1);

    if (!order) {
      console.warn(`[Square Webhook] Order not found for Square order ID: ${orderId}`);
      return;
    }

    // Check payment status
    const paymentStatus = payment.status;
    const isPaid = paymentStatus === "COMPLETED";

    // CRITICAL FIX: Create Duffel order automatically after payment confirmation
    // This ensures tickets are issued even if user doesn't return to checkout/complete page
    if (isPaid && (order.status === "pending" || order.status === "processing") && !order.duffelOrderId) {
      // Update order status to processing first
      await db
        .update(ordersTable)
        .set({
          paymentStatus: "succeeded",
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, order.id));

      console.log(`[Square Webhook] Order #${order.id} payment confirmed`);

      // CRITICAL: Create Duffel order automatically
      if (order.offerId && order.passengerDetails) {
        try {
          console.log(`[Square Webhook] Creating Duffel order for order #${order.id}`);
          
          // Parse passenger details (stored as JSON string in SQLite)
          let passengerDetails: any[];
          try {
            passengerDetails = typeof order.passengerDetails === "string"
              ? JSON.parse(order.passengerDetails)
              : order.passengerDetails;
          } catch (parseError) {
            console.error(`[Square Webhook] Failed to parse passenger details for order #${order.id}:`, parseError);
            throw new Error("Invalid passenger details format");
          }

          if (!Array.isArray(passengerDetails) || passengerDetails.length === 0) {
            throw new Error("No passenger details found in order");
          }

          // Create Duffel order
          const duffelOrder = await createDuffelOrder({
            offerId: order.offerId,
            passengers: passengerDetails.map((p: any) => ({
              type: p.type,
              given_name: p.given_name,
              family_name: p.family_name,
              ...(p.born_on && { born_on: p.born_on }),
              ...(p.gender && { gender: p.gender }),
              ...(p.title && { title: p.title }),
              ...(p.email && { email: p.email }),
              ...(p.phone_number && { phone_number: p.phone_number }),
              ...(p.identity_documents && p.identity_documents.length > 0 && {
                identity_documents: p.identity_documents.map((doc: any) => ({
                  type: doc.type,
                  ...(doc.unique_identifier && { unique_identifier: doc.unique_identifier }),
                  ...(doc.issuing_country_code && { issuing_country_code: doc.issuing_country_code }),
                  ...(doc.expires_on && { expires_on: doc.expires_on }),
                })),
              }),
            })),
          });

          // Update order with Duffel order ID and confirm status
          await db
            .update(ordersTable)
            .set({
              duffelOrderId: duffelOrder.id,
              status: "confirmed",
              updatedAt: new Date(),
            })
            .where(eq(ordersTable.id, order.id));

          console.log(`[Square Webhook] ✅ Duffel order created successfully for order #${order.id}. Duffel Order ID: ${duffelOrder.id}`);

          // Notify owner with success
          await notifyOwner({
            title: "✅ Ticket Emitido - Michel's Travel",
            content: `Ticket emitido com sucesso para pedido #${order.id}\n\n` +
              `Duffel Order ID: ${duffelOrder.id}\n` +
              `Amount: $${((order.amount || 0) / 100).toFixed(2)} ${order.currency}\n` +
              `Customer: ${order.customerEmail}\n` +
              `Square Order ID: ${orderId}`,
          });

          // Log audit event
          await logAuditEvent({
            user: null, // System event
            action: "ticket_issued",
            resource: "order",
            details: {
              orderId: order.id,
              duffelOrderId: duffelOrder.id,
              squareOrderId: orderId,
              amount: order.amount,
              currency: order.currency,
            },
          });
        } catch (duffelError: any) {
          // Log error but don't fail the webhook
          console.error(`[Square Webhook] ❌ Failed to create Duffel order for order #${order.id}:`, duffelError);
          
          // Update order with error but keep payment as succeeded
          await db
            .update(ordersTable)
            .set({
              status: "processing", // Keep as processing, will retry later
              errorMessage: `Duffel order creation failed: ${duffelError.message}`,
              updatedAt: new Date(),
            })
            .where(eq(ordersTable.id, order.id));

          // Notify owner about the error
          await notifyOwner({
            title: "⚠️ Erro na Emissão do Ticket - Michel's Travel",
            content: `Pagamento confirmado mas falha ao emitir ticket para pedido #${order.id}\n\n` +
              `Erro: ${duffelError.message}\n` +
              `Amount: $${((order.amount || 0) / 100).toFixed(2)} ${order.currency}\n` +
              `Customer: ${order.customerEmail}\n` +
              `Square Order ID: ${orderId}\n\n` +
              `AÇÃO NECESSÁRIA: Verificar e criar ordem Duffel manualmente ou corrigir o problema.`,
          });

          // Log audit event for error
          await logAuditEvent({
            user: null,
            action: "ticket_issuance_failed",
            resource: "order",
            details: {
              orderId: order.id,
              squareOrderId: orderId,
              error: duffelError.message,
            },
          });
        }
      } else {
        // Payment confirmed but missing data for Duffel order
        const missingData = [];
        if (!order.offerId) missingData.push("offerId");
        if (!order.passengerDetails) missingData.push("passengerDetails");

        console.warn(`[Square Webhook] Order #${order.id} missing data for Duffel order: ${missingData.join(", ")}`);

        // Notify owner
        await notifyOwner({
          title: "💰 Payment Confirmed - Michel's Travel",
          content: `Payment confirmed for order #${order.id}\n\n` +
            `Amount: $${((order.amount || 0) / 100).toFixed(2)} ${order.currency}\n` +
            `Customer: ${order.customerEmail}\n` +
            `Square Order ID: ${orderId}\n\n` +
            `⚠️ NOTE: Order missing data for automatic ticket issuance (${missingData.join(", ")}). Manual intervention may be required.`,
        });

        // Log audit event
        await logAuditEvent({
          user: null,
          action: "payment_confirmed",
          resource: "order",
          details: {
            orderId: order.id,
            squareOrderId: orderId,
            amount: order.amount,
            currency: order.currency,
            missingData: missingData.join(", "),
          },
        });
      }
    } else if (isPaid && order.duffelOrderId) {
      // Payment confirmed and Duffel order already exists - just update status
      await db
        .update(ordersTable)
        .set({
          paymentStatus: "succeeded",
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, order.id));

      console.log(`[Square Webhook] Order #${order.id} already has Duffel order ${order.duffelOrderId}`);
    }
  } catch (error: any) {
    console.error("[Square Webhook] Error handling payment updated:", error);
    throw error;
  }
}

/**
 * Handle payment created event
 */
async function handlePaymentCreated(event: any): Promise<void> {
  // Similar to handlePaymentUpdated, but for newly created payments
  await handlePaymentUpdated(event);
}
