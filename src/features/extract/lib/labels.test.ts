import { describe, expect, it } from "vitest";
import { findLabelled, findWarrantyMonths } from "./labels";

describe("findLabelled", () => {
  it.each([
    ["Invoice No: INV-2026-0042", "reference", "INV-2026-0042"],
    ["Bill # 118233", "reference", "118233"],
    ["Order ID 402-1234567-8901234", "reference", "402-1234567-8901234"],
    ["S/N: 8H2K9X001", "serial", "8H2K9X001"],
    ["Serial No. C02XK1ABJG5J", "serial", "C02XK1ABJG5J"],
    ["IMEI 356938035643809", "serial", "356938035643809"],
    ["Model: UA55AU7700", "model", "UA55AU7700"],
    ["Model No. WM-1407", "model", "WM-1407"],
  ] as const)("%s → %s", (text, field, value) => {
    expect(findLabelled(text, field)).toEqual({ value, confidence: 0.8 });
  });

  it("does not take a word after the label as a number", () => {
    expect(findLabelled("Invoice Date 14/03/2026", "reference")).toBeUndefined();
  });

  it("offers candidates when labels disagree", () => {
    expect(findLabelled("S/N AB1234\nS/N CD5678", "serial")?.candidates).toEqual(["AB1234", "CD5678"]);
  });
});

describe("findWarrantyMonths", () => {
  it.each([
    ["1 Year Warranty", "12"],
    ["12 months warranty on parts", "12"],
    ["Warranty: 2 years", "24"],
    ["Warranty period - 6 months", "6"],
    ["One year warranty", "12"],
  ])("%s → %s months", (text, months) => expect(findWarrantyMonths(text)?.value).toBe(months));

  it("finds nothing without a warranty phrase", () => {
    expect(findWarrantyMonths("Exchange within 7 days")).toBeUndefined();
  });
});
