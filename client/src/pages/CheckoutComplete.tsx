/**
 * Checkout Complete Page
 * 
 * This page is shown after the user returns from Square payment.
 * It verifies payment status and creates the Duffel order automatically.
 * 
 * DOGMA 1: Security First - Verify payment before creating order
 * DOGMA 2: No Silent Failures - Clear error messages
 * DOGMA 3: Validate ALL Inputs - URL parameters validated
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle, Plane, Mail, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutComplete() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const orderIdParam = params.get("orderId");
  const orderId = orderIdParam ? parseInt(orderIdParam, 10) : null;

  const [verificationStatus, setVerificationStatus] = useState<"checking" | "verified" | "failed" | "processing">("checking");
  const [orderData, setOrderData] = useState<any>(null);

  // Get order details
  const { data: orderDetails, isLoading: orderLoading } = trpc.orders.get.useQuery(
    { orderId: orderId! },
    { 
      enabled: !!orderId && !isNaN(orderId),
      retry: 2,
    }
  );

  // Verify payment and create Duffel order
  const verifyAndCreateOrder = trpc.orders.verifyPaymentAndCreate.useMutation({
    onSuccess: (data) => {
      setVerificationStatus("verified");
      setOrderData(data);
      toast.success("Payment verified! Your flight order is being processed.");
    },
    onError: (error) => {
      setVerificationStatus("failed");
      toast.error(error.message || "Failed to verify payment");
    },
  });

  // Auto-verify payment when page loads
  useEffect(() => {
    if (!orderId || isNaN(orderId)) {
      setVerificationStatus("failed");
      toast.error("Invalid order ID");
      return;
    }

    // Wait for order details to load
    if (orderLoading) return;

    if (!orderDetails) {
      setVerificationStatus("failed");
      toast.error("Order not found");
      return;
    }

    // If order is already confirmed, show success
    if (orderDetails.status === "confirmed") {
      setVerificationStatus("verified");
      setOrderData(orderDetails);
      return;
    }

    // If order is pending, verify payment and create Duffel order
    if (orderDetails.status === "pending" && orderDetails.paymentIntentId) {
      setVerificationStatus("processing");
      verifyAndCreateOrder.mutate({
        orderId,
        paymentIntentId: orderDetails.paymentIntentId,
      });
    } else if (orderDetails.status === "failed") {
      setVerificationStatus("failed");
    }
  }, [orderId, orderDetails, orderLoading]);

  if (!orderId || isNaN(orderId)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Invalid Order</CardTitle>
            <CardDescription>No valid order ID found in the URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "checking" || orderLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
          <p className="text-muted-foreground">Please wait while we verify your payment and process your order.</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing Your Order...</h2>
          <p className="text-muted-foreground">We're creating your flight booking. This may take a few moments.</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Payment Verification Failed</CardTitle>
            <CardDescription>
              {orderDetails?.errorMessage || "We couldn't verify your payment. Please contact support if you were charged."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderId && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <strong>Order ID:</strong> #{orderId}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                Return to Home
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  const flightDetails = orderData?.flightDetails || orderDetails?.flightDetails;
  const duffelOrderId = orderData?.duffelOrderId || orderDetails?.duffelOrderId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50 pb-6">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">Order Confirmed!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your flight booking has been successfully processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Order Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Order ID</div>
                  <div className="font-semibold">#{orderId}</div>
                </div>
                {duffelOrderId && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Booking Reference</div>
                    <div className="font-semibold font-mono text-sm">{duffelOrderId}</div>
                  </div>
                )}
              </div>

              {/* Flight Details */}
              {flightDetails && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Plane className="h-5 w-5 text-primary" />
                    Flight Details
                  </div>
                  {flightDetails.origin && flightDetails.destination && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span className="font-semibold">
                        {flightDetails.origin} → {flightDetails.destination}
                      </span>
                    </div>
                  )}
                  {flightDetails.departureDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Departure
                      </span>
                      <span className="font-semibold">{flightDetails.departureDate}</span>
                    </div>
                  )}
                  {flightDetails.returnDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Return
                      </span>
                      <span className="font-semibold">{flightDetails.returnDate}</span>
                    </div>
                  )}
                  {orderDetails?.passengerCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Passengers
                      </span>
                      <span className="font-semibold">{orderDetails.passengerCount}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Information */}
              {orderDetails && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Payment Confirmed
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold">
                      ${((orderDetails.amount || 0) / 100).toFixed(2)} {orderDetails.currency || "USD"}
                    </span>
                  </div>
                </div>
              )}

              {/* Email Confirmation */}
              {orderDetails?.customerEmail && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900 mb-1">Confirmation Email Sent</div>
                      <div className="text-sm text-blue-700">
                        A confirmation email has been sent to <strong>{orderDetails.customerEmail}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-900 mb-1">What's Next?</div>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>Check your email for booking confirmation and e-ticket</li>
                    <li>Save your booking reference for future reference</li>
                    <li>Contact support if you have any questions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                Return to Home
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="flex-1">
                View My Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

