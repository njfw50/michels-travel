import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the Duffel service
vi.mock("./duffel", () => ({
  getDuffelToken: vi.fn().mockResolvedValue("mock-token"),
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
        total_amount: "500.00",
        total_currency: "USD",
        slices: [
          {
            origin: { iata_code: "JFK", name: "John F. Kennedy International Airport" },
            destination: { iata_code: "LAX", name: "Los Angeles International Airport" },
            duration: "PT6H",
            segments: [
              {
                origin: { iata_code: "JFK", name: "John F. Kennedy International Airport" },
                destination: { iata_code: "LAX", name: "Los Angeles International Airport" },
                departing_at: "2025-01-15T10:00:00",
                arriving_at: "2025-01-15T16:00:00",
                marketing_carrier: { iata_code: "AA", name: "American Airlines" },
                marketing_carrier_flight_number: "100",
                duration: "PT6H",
                aircraft: { name: "Boeing 777" },
              },
            ],
          },
        ],
        owner: { iata_code: "AA", name: "American Airlines" },
      },
    ],
  }),
  searchLocations: vi.fn().mockResolvedValue([
    {
      iataCode: "JFK",
      name: "JOHN F KENNEDY INTL",
      address: { cityName: "NEW YORK", countryName: "UNITED STATES" },
      subType: "AIRPORT",
    },
  ]),
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
