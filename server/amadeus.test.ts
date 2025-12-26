import { describe, expect, it } from "vitest";
import { validateAmadeusCredentials } from "./amadeus";

describe("Amadeus API", () => {
  it("should validate credentials and obtain access token", async () => {
    const isValid = await validateAmadeusCredentials();
    expect(isValid).toBe(true);
  }, 30000);
});
