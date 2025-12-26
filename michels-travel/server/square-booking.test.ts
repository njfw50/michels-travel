import { describe, expect, it, vi, beforeEach } from "vitest";
import { validateCredentials, getMainLocationId } from "./square";

describe("Square Booking Integration", () => {
  it("should validate Square credentials", async () => {
    const isValid = await validateCredentials();
    expect(isValid).toBe(true);
  }, 15000);

  it("should get main location ID", async () => {
    const locationId = await getMainLocationId();
    expect(locationId).toBeDefined();
    expect(typeof locationId).toBe("string");
    expect(locationId.length).toBeGreaterThan(0);
  });
});
