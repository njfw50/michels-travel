import { describe, expect, it, beforeEach } from "vitest";
import { 
  flightCache, 
  locationCache, 
  popularRoutesCache,
  cachedFlightSearch,
  cachedLocationSearch 
} from "./cache";

describe("Flight Cache System", () => {
  beforeEach(() => {
    flightCache.clear();
  });

  describe("Cache Key Generation", () => {
    it("should generate consistent keys for same parameters", () => {
      const params = {
        origin: "JFK",
        destination: "LAX",
        departureDate: "2025-03-15",
        adults: 2,
      };

      const key1 = flightCache.generateKey(params);
      const key2 = flightCache.generateKey(params);

      expect(key1).toBe(key2);
    });

    it("should normalize airport codes to uppercase", () => {
      const params1 = {
        origin: "jfk",
        destination: "lax",
        departureDate: "2025-03-15",
        adults: 1,
      };

      const params2 = {
        origin: "JFK",
        destination: "LAX",
        departureDate: "2025-03-15",
        adults: 1,
      };

      expect(flightCache.generateKey(params1)).toBe(flightCache.generateKey(params2));
    });

    it("should generate different keys for different parameters", () => {
      const params1 = {
        origin: "JFK",
        destination: "LAX",
        departureDate: "2025-03-15",
        adults: 1,
      };

      const params2 = {
        origin: "JFK",
        destination: "SFO",
        departureDate: "2025-03-15",
        adults: 1,
      };

      expect(flightCache.generateKey(params1)).not.toBe(flightCache.generateKey(params2));
    });
  });

  describe("Cache Operations", () => {
    it("should store and retrieve data", () => {
      const key = "test-key";
      const data = { flights: [{ id: 1 }] };

      flightCache.set(key, data);
      const retrieved = flightCache.get(key);

      expect(retrieved).toEqual(data);
    });

    it("should return null for non-existent keys", () => {
      const result = flightCache.get("non-existent");
      expect(result).toBeNull();
    });

    it("should track cache statistics", () => {
      const key = "stats-test";
      flightCache.set(key, { data: "test" });

      // First access - should be a hit
      flightCache.get(key);
      
      // Non-existent key - should be a miss
      flightCache.get("missing");

      const stats = flightCache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe("Cache Expiration", () => {
    it("should expire entries after TTL", async () => {
      const key = "expire-test";
      const data = { test: true };

      // Set with very short TTL (1ms)
      flightCache.set(key, data, 1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = flightCache.get(key);
      expect(result).toBeNull();
    });
  });
});

describe("Location Cache", () => {
  describe("Key Generation", () => {
    it("should normalize keywords to lowercase", () => {
      const key1 = locationCache.generateKey("NEW YORK");
      const key2 = locationCache.generateKey("new york");

      expect(key1).toBe(key2);
    });

    it("should trim whitespace", () => {
      const key1 = locationCache.generateKey("  paris  ");
      const key2 = locationCache.generateKey("paris");

      expect(key1).toBe(key2);
    });
  });
});

describe("Popular Routes Cache", () => {
  describe("Route Tracking", () => {
    it("should track search counts", () => {
      // Record multiple searches
      for (let i = 0; i < 6; i++) {
        popularRoutesCache.recordSearch("JFK", "LAX");
      }

      expect(popularRoutesCache.isPopularRoute("JFK", "LAX")).toBe(true);
    });

    it("should not mark routes as popular with few searches", () => {
      popularRoutesCache.recordSearch("SFO", "ORD");
      popularRoutesCache.recordSearch("SFO", "ORD");

      expect(popularRoutesCache.isPopularRoute("SFO", "ORD")).toBe(false);
    });

    it("should return top routes sorted by count", () => {
      // Create some route data
      for (let i = 0; i < 10; i++) {
        popularRoutesCache.recordSearch("MIA", "NYC");
      }
      for (let i = 0; i < 5; i++) {
        popularRoutesCache.recordSearch("BOS", "DCA");
      }

      const topRoutes = popularRoutesCache.getTopRoutes(5);
      expect(topRoutes.length).toBeGreaterThan(0);
      
      // Verify sorting (highest count first)
      for (let i = 1; i < topRoutes.length; i++) {
        expect(topRoutes[i - 1].count).toBeGreaterThanOrEqual(topRoutes[i].count);
      }
    });
  });
});

describe("Cached Search Functions", () => {
  it("should return fromCache: false on first call", async () => {
    const params = {
      origin: "TEST1",
      destination: "TEST2",
      departureDate: "2025-06-01",
      adults: 1,
    };

    const mockFetch = async () => ({ data: [], dictionaries: {} });

    const result = await cachedFlightSearch(params, mockFetch);
    expect(result.fromCache).toBe(false);
  });

  it("should return fromCache: true on subsequent calls", async () => {
    const params = {
      origin: "CACHE1",
      destination: "CACHE2",
      departureDate: "2025-07-01",
      adults: 1,
    };

    const mockFetch = async () => ({ data: [{ id: "flight1" }], dictionaries: {} });

    // First call
    await cachedFlightSearch(params, mockFetch);

    // Second call should be cached
    const result = await cachedFlightSearch(params, mockFetch);
    expect(result.fromCache).toBe(true);
  });
});
