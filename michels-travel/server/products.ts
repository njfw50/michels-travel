/**
 * Stripe Products Configuration for Michel's Travel
 * 
 * Flight bookings are dynamic products created at checkout time
 * based on the selected flight offer.
 */

export const BOOKING_FEE = {
  name: "Booking Service Fee",
  description: "Michel's Travel service fee for flight booking assistance",
  amount: 2500, // $25.00 in cents
  currency: "usd",
};

export const TRAVEL_CLASSES = {
  ECONOMY: {
    name: "Economy Class",
    multiplier: 1.0,
  },
  PREMIUM_ECONOMY: {
    name: "Premium Economy",
    multiplier: 1.3,
  },
  BUSINESS: {
    name: "Business Class",
    multiplier: 2.5,
  },
  FIRST: {
    name: "First Class",
    multiplier: 4.0,
  },
};

/**
 * Calculate total price for a flight booking
 * @param basePrice - Base flight price in cents
 * @param passengers - Number of passengers
 * @param includeServiceFee - Whether to include the booking service fee
 */
export function calculateTotalPrice(
  basePrice: number,
  passengers: number,
  includeServiceFee: boolean = true
): number {
  const flightTotal = basePrice * passengers;
  const serviceFee = includeServiceFee ? BOOKING_FEE.amount : 0;
  return flightTotal + serviceFee;
}

/**
 * Format price for display
 * @param amountInCents - Amount in cents
 * @param currency - Currency code (default: USD)
 */
export function formatPrice(amountInCents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amountInCents / 100);
}
