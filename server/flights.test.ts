import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the Amadeus service
vi.mock("./amadeus", () => ({
  getAmadeusToken: vi.fn().mockResolvedValue("mock-token"),
  formatDuration: vi.fn().mockImplementation((duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    return `${hours}h ${minutes}m`;
  }),
  searchFlights: vi.fn().mockResolvedValue({
    data: [
      {
        id: "1",
        price: { total: "500.00", currency: "USD", base: "450.00", grandTotal: "500.00" },
        itineraries: [
          {
            duration: "PT6H",
            segments: [
              {
                departure: { iataCode: "JFK", at: "2025-01-15T10:00:00", terminal: "1" },
                arrival: { iataCode: "LAX", at: "2025-01-15T13:00:00", terminal: "4" },
                carrierCode: "AA",
                number: "100",
                aircraft: { code: "777" },
                operating: { carrierCode: "AA" },
                duration: "PT6H",
              },
            ],
          },
        ],
        travelerPricings: [
          {
            fareDetailsBySegment: [
              {
                cabin: "ECONOMY",
                includedCheckedBags: { weight: 23, weightUnit: "KG" },
              },
            ],
          },
        ],
        validatingAirlineCodes: ["AA"],
        numberOfBookableSeats: 5,
        lastTicketingDate: "2025-01-10",
      },
    ],
    dictionaries: {
      carriers: { AA: "American Airlines" },
    },
  }),
  searchLocations: vi.fn().mockResolvedValue({
    data: [
      {
        iataCode: "JFK",
        name: "JOHN F KENNEDY INTL",
        address: { cityName: "NEW YORK", countryName: "UNITED STATES" },
        subType: "AIRPORT",
      },
    ],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("flights router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchLocations", () => {
    it("throws validation error for short keywords", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.flights.searchLocations({ keyword: "a" })
      ).rejects.toThrow();
    });
  });

  describe("search", () => {
    it("throws validation error for missing required fields", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.flights.search({
          origin: "",
          destination: "",
          departureDate: "",
          adults: 1,
        })
      ).rejects.toThrow();
    });

  });
});
