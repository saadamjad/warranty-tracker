import { describe, expect, it } from "vitest";
import { findAmount, findCurrency, normaliseNumber } from "./money";

describe("normaliseNumber", () => {
  it.each([
    ["1,299.00", "1299.00"],
    ["1.299,00", "1299.00"],
    ["12,500", "12500.00"],
    ["1 299", "1299.00"],
    ["45.5", "45.50"],
    ["899", "899.00"],
  ])("%s → %s", (raw, expected) => expect(normaliseNumber(raw)).toBe(expected));
});

describe("findCurrency", () => {
  it.each([
    ["TOTAL Rs. 12,500", "PKR"],
    ["Amount PKR 4,000", "PKR"],
    ["Total ₹ 999", "INR"],
    ["Total €19,99", "EUR"],
    ["Total £45.00", "GBP"],
    ["AED 150.00", "AED"],
  ])("%s → %s", (text, code) => expect(findCurrency(text)?.value).toBe(code));

  it("marks a bare $ for checking", () => {
    expect(findCurrency("Total $19.99")).toEqual({ value: "USD", confidence: 0.5 });
  });

  it("never assumes a currency (D-31)", () => {
    expect(findCurrency("TOTAL 12,500")).toBeUndefined();
  });
});

describe("findAmount", () => {
  it("takes the grand total over sub-total and tax", () => {
    const text = "Sub Total 10,000.00\nGST 17% 1,700.00\nGrand Total 11,700.00\nCash 12,000.00\nChange 300.00";
    expect(findAmount(text)).toEqual({ value: "11700.00", confidence: 0.9 });
  });

  it("reads a plain Total line", () => {
    expect(findAmount("Kettle 1 x 4,500\nTOTAL 4,500")).toMatchObject({ value: "4500.00" });
  });

  it("ignores total item counts", () => {
    expect(findAmount("Total Items 3\nNet Payable 2,340.50")?.value).toBe("2340.50");
  });

  it("offers candidates when two totals disagree", () => {
    const found = findAmount("Total 1,000.00\nTotal 1,180.00");
    expect(found?.candidates).toEqual(["1180.00", "1000.00"]);
    expect(found?.confidence).toBeLessThan(0.7);
  });

  it("falls back to a low-confidence guess without a total line", () => {
    const found = findAmount("Charger 1,250.00\nCable 350.00");
    expect(found).toMatchObject({ value: "1250.00", confidence: 0.3 });
  });

  it("finds nothing in text without numbers", () => {
    expect(findAmount("THANK YOU")).toBeUndefined();
  });
});
