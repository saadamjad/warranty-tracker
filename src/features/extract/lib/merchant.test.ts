import { describe, expect, it } from "vitest";
import { findMerchant } from "./merchant";

describe("findMerchant", () => {
  it("takes the first name-like line and tidies capitals", () => {
    expect(findMerchant("TAX INVOICE\nHI-FI ELECTRONICS\nShop 12, Main Blvd")?.value).toBe("Hi-Fi Electronics");
  });

  it("skips phone, date and number lines", () => {
    expect(findMerchant("Tel: 042-111-222\n14/03/2026\n#### 123\nMetro Cash & Carry")?.value).toBe("Metro Cash & Carry");
  });

  it("is always offered for checking", () => {
    expect(findMerchant("Ikea")?.confidence).toBeLessThan(0.7);
  });

  it("finds nothing in unreadable text", () => {
    expect(findMerchant("12 34 56\n$$ %%")).toBeUndefined();
  });
});
