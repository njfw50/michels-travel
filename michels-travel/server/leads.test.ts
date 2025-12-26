import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database operations
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock notification service
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
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

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("leads router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates a lead with required fields", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.create({
        name: "John Doe",
        email: "john@example.com",
        type: "quote",
      });

      expect(result).toEqual({ success: true });
    });

    it("creates a lead with flight details", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.create({
        name: "Jane Doe",
        email: "jane@example.com",
        type: "booking",
        origin: "JFK",
        originName: "New York (JFK)",
        destination: "LAX",
        destinationName: "Los Angeles (LAX)",
        departureDate: "2025-01-15",
        returnDate: "2025-01-22",
        adults: 2,
        children: 1,
        infants: 0,
        travelClass: "BUSINESS",
        estimatedPrice: "2500.00",
        message: "Need window seats",
        preferredLanguage: "en",
      });

      expect(result).toEqual({ success: true });
    });

    it("creates a contact lead", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.create({
        name: "Contact Person",
        email: "contact@example.com",
        type: "contact",
        message: "I have a question about group bookings",
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("list", () => {
    it("returns leads for authenticated users", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
