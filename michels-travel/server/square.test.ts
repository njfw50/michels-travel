import { describe, expect, it } from "vitest";
import { validateCredentials, getMainLocationId } from "./square";

describe("Square Integration", () => {
  it("should validate Square credentials by listing locations", async () => {
    const isValid = await validateCredentials();
    expect(isValid).toBe(true);
  }, 15000);

  it("should get main location ID", async () => {
    const locationId = await getMainLocationId();
    expect(locationId).toBeDefined();
    expect(typeof locationId).toBe("string");
    expect(locationId.length).toBeGreaterThan(0);
  }, 15000);
});
