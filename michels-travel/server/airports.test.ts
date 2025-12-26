import { describe, expect, it } from "vitest";
import { searchLocalAirports, getAirportByCode, AIRPORTS_DATABASE } from "./airports";

describe("Airports Database", () => {
  describe("Database Coverage", () => {
    it("should have comprehensive worldwide coverage", () => {
      expect(AIRPORTS_DATABASE.length).toBeGreaterThan(200);
    });

    it("should include major Brazilian airports", () => {
      const brazilianCodes = ["GRU", "GIG", "CGH", "SDU", "BSB", "CNF", "SSA", "REC", "FOR", "POA"];
      for (const code of brazilianCodes) {
        const airport = getAirportByCode(code);
        expect(airport).toBeDefined();
        expect(airport?.countryCode).toBe("BR");
      }
    });

    it("should include major Portuguese airports", () => {
      const portugueseCodes = ["LIS", "OPO", "FAO", "FNC"];
      for (const code of portugueseCodes) {
        const airport = getAirportByCode(code);
        expect(airport).toBeDefined();
        expect(airport?.countryCode).toBe("PT");
      }
    });

    it("should include major US airports", () => {
      const usCodes = ["JFK", "LAX", "ORD", "ATL", "MIA", "SFO", "DFW", "DEN"];
      for (const code of usCodes) {
        const airport = getAirportByCode(code);
        expect(airport).toBeDefined();
        expect(airport?.countryCode).toBe("US");
      }
    });

    it("should include major European airports", () => {
      const euroCodes = ["LHR", "CDG", "FRA", "AMS", "MAD", "BCN", "FCO", "MUC"];
      for (const code of euroCodes) {
        const airport = getAirportByCode(code);
        expect(airport).toBeDefined();
      }
    });
  });

  describe("searchLocalAirports", () => {
    it("should find Rio de Janeiro airports", () => {
      const results = searchLocalAirports("Rio");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.code === "GIG")).toBe(true);
    });

    it("should find Lisboa/Lisbon airport", () => {
      const results = searchLocalAirports("Lisboa");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.code === "LIS")).toBe(true);
    });

    it("should find Guarulhos airport", () => {
      const results = searchLocalAirports("Guarulhos");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.code === "GRU")).toBe(true);
    });

    it("should find São Paulo airports", () => {
      const results = searchLocalAirports("São Paulo");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.code === "GRU" || r.code === "CGH")).toBe(true);
    });

    it("should find airports by IATA code", () => {
      const results = searchLocalAirports("GRU");
      expect(results.length).toBe(1);
      expect(results[0].code).toBe("GRU");
    });

    it("should find airports by country", () => {
      const results = searchLocalAirports("Brazil");
      expect(results.length).toBeGreaterThan(5);
      expect(results.every(r => r.countryCode === "BR")).toBe(true);
    });

    it("should return empty for short keywords", () => {
      const results = searchLocalAirports("a");
      expect(results.length).toBe(0);
    });

    it("should be case insensitive", () => {
      const results1 = searchLocalAirports("MIAMI");
      const results2 = searchLocalAirports("miami");
      const results3 = searchLocalAirports("Miami");
      
      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });

    it("should limit results to 15", () => {
      const results = searchLocalAirports("air");
      expect(results.length).toBeLessThanOrEqual(15);
    });

    it("should prioritize exact city matches", () => {
      const results = searchLocalAirports("Paris");
      expect(results[0].city).toBe("Paris");
    });
  });

  describe("getAirportByCode", () => {
    it("should find airport by exact code", () => {
      const airport = getAirportByCode("JFK");
      expect(airport).toBeDefined();
      expect(airport?.name).toContain("Kennedy");
      expect(airport?.city).toBe("New York");
    });

    it("should be case insensitive", () => {
      const airport1 = getAirportByCode("jfk");
      const airport2 = getAirportByCode("JFK");
      expect(airport1).toEqual(airport2);
    });

    it("should return undefined for non-existent code", () => {
      const airport = getAirportByCode("XXX");
      expect(airport).toBeUndefined();
    });
  });
});
