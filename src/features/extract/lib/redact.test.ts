import { describe, expect, it } from "vitest";
import { CARD_REMOVED, redactCardNumbers } from "./redact";

describe("redactCardNumbers", () => {
  it("removes real card numbers in any grouping (rule 12)", () => {
    expect(redactCardNumbers("VISA 4111 1111 1111 1111 approved")).toBe(`VISA ${CARD_REMOVED} approved`);
    expect(redactCardNumbers("5500-0000-0000-0004")).toBe(CARD_REMOVED);
    expect(redactCardNumbers("card 378282246310005")).toBe(`card ${CARD_REMOVED}`);
  });

  it("removes masked card numbers", () => {
    expect(redactCardNumbers("CARD: XXXX XXXX XXXX 1234")).toBe(`CARD: ${CARD_REMOVED}`);
    expect(redactCardNumbers("**** **** **** 9876")).toBe(CARD_REMOVED);
  });

  it("keeps long numbers that aren't cards, like serials and barcodes", () => {
    expect(redactCardNumbers("Serial 1234567890123")).toBe("Serial 1234567890123");
    expect(redactCardNumbers("Invoice INV-2026-000123")).toBe("Invoice INV-2026-000123");
  });
});
